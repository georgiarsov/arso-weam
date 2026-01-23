'use client';
import dynamic from 'next/dynamic';
const WorkflowItems = dynamic(() => import('./WorkflowItems'), { ssr: false });

export const WorkflowItemsWrapper = () => {
    return <WorkflowItems />;
};
