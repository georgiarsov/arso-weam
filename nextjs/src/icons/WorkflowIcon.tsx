type WorkflowIconProps = {
    width?: number | string;
    height?: number | string;
    className?: string;
}

const WorkflowIcon = ({ width = 18, height = 18, className = '' }: WorkflowIconProps) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M4 4H8V8H4V4Z"
                fill="currentColor"
            />
            <path
                d="M10 5H14V7H10V5Z"
                fill="currentColor"
            />
            <path
                d="M16 4H20V8H16V4Z"
                fill="currentColor"
            />
            <path
                d="M18 10V14H16V10H18Z"
                fill="currentColor"
            />
            <path
                d="M4 16H8V20H4V16Z"
                fill="currentColor"
            />
            <path
                d="M10 17H14V19H10V17Z"
                fill="currentColor"
            />
            <path
                d="M16 16H20V20H16V16Z"
                fill="currentColor"
            />
            <path
                d="M6 10V14H4V10H6Z"
                fill="currentColor"
            />
            <path
                d="M11 10H13V14H11V10Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default WorkflowIcon;
