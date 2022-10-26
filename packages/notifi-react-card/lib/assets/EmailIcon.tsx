import React, { SVGAttributes } from 'react';

export const EmailIcon: React.FC<SVGAttributes<SVGElement>> = (props) => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_136_721)">
        <path
          d="M12.5 2.49999H2.5C1.8125 2.49999 1.25625 3.06249 1.25625 3.74999L1.25 11.25C1.25 11.9375 1.8125 12.5 2.5 12.5H12.5C13.1875 12.5 13.75 11.9375 13.75 11.25V3.74999C13.75 3.06249 13.1875 2.49999 12.5 2.49999ZM12.5 4.99999L7.5 8.12499L2.5 4.99999V3.74999L7.5 6.87499L12.5 3.74999V4.99999Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_136_721">
          <rect width="15" height="15" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
