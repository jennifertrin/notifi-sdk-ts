import { Types } from '@notifi-network/notifi-graphql';
import { NotifiService } from '@notifi-network/notifi-graphql';

import type { NotifiFrontendConfiguration } from '../configuration';
import type { CardConfigItemV1, EventTypeItem } from '../models';
import type { Authorization, NotifiStorage, Roles } from '../storage';
import { notNullOrEmpty, packFilterOptions } from '../utils';
import { areIdsEqual } from '../utils/areIdsEqual';
import { ensureSourceAndFilters } from './ensureSource';
import {
  ensureEmail,
  ensureSms,
  ensureTelegram,
  ensureWebhook,
} from './ensureTarget';

// TODO: Clean up blockchain-specific dependencies out of this package
export type SolanaSignMessageFunction = (
  message: Uint8Array,
) => Promise<Uint8Array>;
export type AptosSignMessageFunction = (
  message: string,
  nonce: number,
) => Promise<string>;

type BeginLoginProps = Omit<Types.BeginLogInByTransactionInput, 'dappAddress'>;

type CompleteLoginProps = Omit<
  Types.CompleteLogInByTransactionInput,
  'dappAddress' | 'randomUuid'
>;

type EnsureWebhookParams = Omit<
  Types.CreateWebhookTargetMutationVariables,
  'name'
>;

type FindSubscriptionCardParams = Omit<Types.FindTenantConfigInput, 'tenant'>;

// Don't split this line into multiple lines due to some packagers or other build modules that
// modify the string literal, which then causes authentication to fail due to different strings
export const SIGNING_MESSAGE = `Sign in with Notifi \n\n    No password needed or gas is needed. \n\n    Clicking “Approve” only means you have proved this wallet is owned by you! \n\n    This request will not trigger any transaction or cost any gas fees. \n\n    Use of our website and service is subject to our terms of service and privacy policy. \n \n 'Nonce:' `;

// TODO: Dedupe from react-hooks
export type SignMessageParams =
  | Readonly<{
      walletBlockchain: 'SOLANA';
      signMessage: SolanaSignMessageFunction;
    }>
  | Readonly<{
      walletBlockchain: 'APTOS';
      signMessage: AptosSignMessageFunction;
    }>;

export type SupportedCardConfigType = CardConfigItemV1;

export type UserState = Readonly<
  | {
      status: 'loggedOut';
    }
  | {
      status: 'authenticated';
      authorization: Authorization;
      roles: Roles;
    }
  | {
      status: 'expired';
      authorization: Authorization;
    }
>;

export class NotifiFrontendClient {
  constructor(
    private _configuration: NotifiFrontendConfiguration,
    private _service: NotifiService,
    private _storage: NotifiStorage,
  ) {}

  private _clientRandomUuid: string | null = null;

  async initialize(): Promise<UserState> {
    const [storedAuthorization, roles] = await Promise.all([
      this._storage.getAuthorization(),
      this._storage.getRoles(),
    ]);

    let authorization = storedAuthorization;
    if (authorization === null) {
      this._service.setJwt(undefined);
      return {
        status: 'loggedOut',
      };
    }

    const expiryDate = new Date(authorization.expiry);
    const now = new Date();
    if (expiryDate <= now) {
      this._service.setJwt(undefined);
      return {
        status: 'expired',
        authorization,
      };
    }

    const refreshTime = new Date();
    refreshTime.setDate(now.getDate() + 7);
    if (expiryDate < refreshTime) {
      try {
        const refreshMutation = await this._service.refreshAuthorization({});
        const newAuthorization = refreshMutation.refreshAuthorization;
        if (newAuthorization !== undefined) {
          this._storage.setAuthorization(newAuthorization);
          authorization = newAuthorization;
        }
      } catch (e: unknown) {
        console.log('Failed to refresh Notifi token', e);
      }
    }

    this._service.setJwt(authorization.token);
    return {
      status: 'authenticated',
      authorization,
      roles: roles ?? [],
    };
  }

  async logOut(): Promise<UserState> {
    await Promise.all([
      this._storage.setAuthorization(null),
      this._storage.setRoles(null),
      this._service.logOut(),
    ]);

    return {
      status: 'loggedOut',
    };
  }

  async logIn(
    signMessageParams: SignMessageParams,
  ): Promise<Types.UserFragmentFragment> {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = await this._signMessage({
      signMessageParams,
      timestamp,
    });

    const { tenantId, walletBlockchain } = this._configuration;

    let loginResult: Types.UserFragmentFragment | undefined = undefined;
    switch (walletBlockchain) {
      case 'SOLANA': {
        const result = await this._service.logInFromDapp({
          walletBlockchain,
          walletPublicKey: this._configuration.walletPublicKey,
          dappAddress: tenantId,
          timestamp,
          signature,
        });
        loginResult = result.logInFromDapp;
        break;
      }
      case 'APTOS': {
        const result = await this._service.logInFromDapp({
          walletBlockchain,
          walletPublicKey: this._configuration.authenticationKey,
          accountId: this._configuration.accountAddress,
          dappAddress: tenantId,
          timestamp,
          signature,
        });
        loginResult = result.logInFromDapp;
        break;
      }
    }

    if (loginResult === undefined) {
      return Promise.reject('Failed to login');
    }

    await this._handleLogInResult(loginResult);
    return loginResult;
  }

  private async _signMessage({
    signMessageParams,
    timestamp,
  }: Readonly<{
    signMessageParams: SignMessageParams;
    timestamp: number;
  }>): Promise<string> {
    switch (signMessageParams.walletBlockchain) {
      case 'SOLANA': {
        if (this._configuration.walletBlockchain !== 'SOLANA') {
          throw new Error(
            'Sign message params and configuration must have the same blockchain',
          );
        }
        const { walletPublicKey, tenantId } = this._configuration;
        const messageBuffer = new TextEncoder().encode(
          `${SIGNING_MESSAGE}${walletPublicKey}${tenantId}${timestamp.toString()}`,
        );

        const signedBuffer = await signMessageParams.signMessage(messageBuffer);
        const signature = Buffer.from(signedBuffer).toString('base64');
        return signature;
      }
      case 'APTOS': {
        if (this._configuration.walletBlockchain !== 'APTOS') {
          throw new Error(
            'Sign message params and configuration must have the same blockchain',
          );
        }
        const signature = await signMessageParams.signMessage(
          SIGNING_MESSAGE,
          timestamp,
        );
        return signature;
      }
    }
  }

  private async _handleLogInResult(
    user: Types.UserFragmentFragment | undefined,
  ): Promise<void> {
    const authorization = user?.authorization;
    const saveAuthorizationPromise =
      authorization !== undefined
        ? this._storage.setAuthorization(authorization)
        : Promise.resolve();

    const roles = user?.roles;
    const saveRolesPromise =
      roles !== undefined
        ? this._storage.setRoles(roles.filter(notNullOrEmpty))
        : Promise.resolve();

    await Promise.all([saveAuthorizationPromise, saveRolesPromise]);
  }

  async beginLoginViaTransaction({
    walletBlockchain,
    walletAddress,
  }: BeginLoginProps): Promise<Types.BeginLogInByTransactionResult> {
    const { tenantId } = this._configuration;

    const result = await this._service.beginLogInByTransaction({
      walletAddress: walletAddress,
      walletBlockchain: walletBlockchain,
      dappAddress: tenantId,
    });

    const nonce = result.beginLogInByTransaction.nonce;

    if (nonce === null) {
      throw new Error('Failed to begin login process');
    }

    const ruuid = crypto.randomUUID();
    this._clientRandomUuid = ruuid;
    const encoder = new TextEncoder();
    const data = encoder.encode(nonce + ruuid);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const logValue =
      'Notifi Auth: 0x' +
      hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return { nonce: logValue };
  }

  async completeLoginViaTransaction({
    walletBlockchain,
    walletAddress,
    transactionSignature,
  }: CompleteLoginProps): Promise<Types.CompleteLogInByTransactionMutation> {
    const { tenantId } = this._configuration;
    const clientRandomUuid = this._clientRandomUuid;

    this._clientRandomUuid = null;

    if (clientRandomUuid === null) {
      throw new Error(
        'BeginLoginViaTransaction is required to be called first',
      );
    }

    const result = await this._service.completeLogInByTransaction({
      walletAddress: walletAddress,
      walletBlockchain: walletBlockchain,
      dappAddress: tenantId,
      randomUuid: clientRandomUuid,
      transactionSignature,
    });

    await this._handleLogInResult(result.completeLogInByTransaction);

    return result;
  }

  async getTargetGroups(): Promise<
    ReadonlyArray<Types.TargetGroupFragmentFragment>
  > {
    const query = await this._service.getTargetGroups({});
    const results = query.targetGroup?.filter(notNullOrEmpty) ?? [];
    return results;
  }

  async ensureTargetGroup({
    name,
    emailAddress,
    phoneNumber,
    telegramId,
    webhook,
  }: Readonly<{
    name: string;
    emailAddress?: string;
    phoneNumber?: string;
    telegramId?: string;
    webhook?: EnsureWebhookParams;
  }>): Promise<Types.TargetGroupFragmentFragment> {
    const [
      targetGroupsQuery,
      emailTargetId,
      smsTargetId,
      telegramTargetId,
      webhookTargetId,
    ] = await Promise.all([
      this._service.getTargetGroups({}),
      ensureEmail(this._service, emailAddress),
      ensureSms(this._service, phoneNumber),
      ensureTelegram(this._service, telegramId),
      ensureWebhook(this._service, webhook),
    ]);

    const emailTargetIds = emailTargetId === undefined ? [] : [emailTargetId];
    const smsTargetIds = smsTargetId === undefined ? [] : [smsTargetId];
    const telegramTargetIds =
      telegramTargetId === undefined ? [] : [telegramTargetId];
    const webhookTargetIds =
      webhookTargetId === undefined ? [] : [webhookTargetId];

    const existing = targetGroupsQuery.targetGroup?.find(
      (it) => it?.name === name,
    );
    if (existing !== undefined) {
      return this._updateTargetGroup({
        existing,
        emailTargetIds,
        smsTargetIds,
        telegramTargetIds,
        webhookTargetIds,
      });
    }

    const createMutation = await this._service.createTargetGroup({
      name,
      emailTargetIds,
      smsTargetIds,
      telegramTargetIds,
      webhookTargetIds,
    });

    if (createMutation.createTargetGroup === undefined) {
      throw new Error('Failed to create target group');
    }

    return createMutation.createTargetGroup;
  }

  private async _updateTargetGroup({
    existing,
    emailTargetIds,
    smsTargetIds,
    telegramTargetIds,
    webhookTargetIds,
  }: Readonly<{
    existing: Types.TargetGroupFragmentFragment;
    emailTargetIds: Array<string>;
    smsTargetIds: Array<string>;
    telegramTargetIds: Array<string>;
    webhookTargetIds: Array<string>;
  }>): Promise<Types.TargetGroupFragmentFragment> {
    if (
      areIdsEqual(emailTargetIds, existing.emailTargets ?? []) &&
      areIdsEqual(smsTargetIds, existing.smsTargets ?? []) &&
      areIdsEqual(telegramTargetIds, existing.telegramTargets ?? []) &&
      areIdsEqual(webhookTargetIds, existing.webhookTargets ?? [])
    ) {
      return existing;
    }

    const updateMutation = await this._service.updateTargetGroup({
      id: existing.id,
      name: existing.name ?? existing.id,
      emailTargetIds,
      smsTargetIds,
      telegramTargetIds,
      webhookTargetIds,
    });

    const updated = updateMutation.updateTargetGroup;
    if (updated === undefined) {
      throw new Error('Failed to update target group');
    }

    return updated;
  }

  async getSourceGroups(): Promise<
    ReadonlyArray<Types.SourceGroupFragmentFragment>
  > {
    const query = await this._service.getSourceGroups({});
    const results = query.sourceGroup?.filter(notNullOrEmpty) ?? [];
    return results;
  }

  async getAlerts(): Promise<ReadonlyArray<Types.AlertFragmentFragment>> {
    const query = await this._service.getAlerts({});
    return query.alert?.filter(notNullOrEmpty) ?? [];
  }

  async ensureAlert({
    eventType,
    inputs,
  }: Readonly<{
    eventType: EventTypeItem;
    inputs: Record<string, string | undefined>;
  }>): Promise<Types.AlertFragmentFragment> {
    const [alertsQuery, targetGroupsQuery, sourceAndFilters] =
      await Promise.all([
        this._service.getAlerts({}),
        this._service.getTargetGroups({}),
        ensureSourceAndFilters(this._service, eventType, inputs),
      ]);

    const targetGroup = targetGroupsQuery.targetGroup?.find(
      (it) => it?.name === 'Default',
    );
    if (targetGroup === undefined) {
      throw new Error('Default target group does not exist');
    }

    const { sourceGroup, filter, filterOptions } = sourceAndFilters;
    const packedOptions = packFilterOptions(filterOptions);

    const existing = alertsQuery.alert?.find(
      (it) => it !== undefined && it.name === eventType.name,
    );

    if (existing !== undefined) {
      if (
        existing.sourceGroup.id === sourceGroup.id &&
        existing.targetGroup.id === targetGroup.id &&
        existing.filter.id === filter.id &&
        existing.filterOptions === packedOptions
      ) {
        return existing;
      }

      // Alerts are immutable, delete the existing instead
      await this.deleteAlert({
        id: existing.id,
      });
    }

    const mutation = await this._service.createAlert({
      name: eventType.name,
      sourceGroupId: sourceGroup.id,
      filterId: filter.id,
      targetGroupId: targetGroup.id,
      filterOptions: packedOptions,
      groupName: 'managed',
    });

    const created = mutation.createAlert;
    if (created === undefined) {
      throw new Error('Failed to create alert');
    }

    return created;
  }

  async deleteAlert({
    id,
  }: Readonly<{
    id: string;
  }>): Promise<void> {
    const mutation = await this._service.deleteAlert({ id });
    const result = mutation.deleteAlert?.id;
    if (result === undefined) {
      throw new Error('Failed to delete alert');
    }
  }

  async getNotificationHistory(
    variables: Types.GetNotificationHistoryQueryVariables,
  ): Promise<
    Readonly<{
      pageInfo: Types.PageInfoFragmentFragment;
      nodes: ReadonlyArray<Types.NotificationHistoryEntryFragmentFragment>;
    }>
  > {
    const query = await this._service.getNotificationHistory(variables);
    const nodes = query.notificationHistory?.nodes;
    const pageInfo = query.notificationHistory?.pageInfo;
    if (nodes === undefined || pageInfo === undefined) {
      throw new Error('Failed to fetch notification history');
    }

    return { pageInfo, nodes };
  }

  async fetchSubscriptionCard(
    variables: FindSubscriptionCardParams,
  ): Promise<SupportedCardConfigType> {
    const query = await this._service.findTenantConfig({
      input: {
        ...variables,
        tenant: this._configuration.tenantId,
      },
    });
    const result = query.findTenantConfig;
    if (result === undefined) {
      throw new Error('Failed to find tenant config');
    }

    const value = result.dataJson;
    if (value === undefined) {
      throw new Error('Invalid config data');
    }

    const obj = JSON.parse(value);
    let card: SupportedCardConfigType | undefined = undefined;
    switch (obj.version) {
      case 'v1': {
        card = obj as CardConfigItemV1;
        break;
      }
    }

    if (card === undefined) {
      throw new Error('Unsupported config format');
    }

    return card;
  }

  async sendEmailTargetVerification({
    targetId,
  }: Readonly<{ targetId: string }>): Promise<string> {
    const emailTarget = await this._service.sendEmailTargetVerificationRequest({
      targetId,
    });

    const id = emailTarget.sendEmailTargetVerificationRequest?.id;
    if (id === undefined) {
      throw new Error(`Unknown error requesting verification`);
    }
    return id;
  }
}
