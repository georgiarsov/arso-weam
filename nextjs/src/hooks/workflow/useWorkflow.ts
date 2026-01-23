import commonApi from '@/api';
import { MODULES, MODULE_ACTIONS, SEARCH_AND_FILTER_OPTIONS, DEFAULT_SORT } from '@/utils/constant';
import { decodedObjectId } from '@/utils/helper';
import Toast from '@/utils/toast';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { APIResponseType, DefaultPaginationType, PaginatorType } from '@/types/common';
import { WorkflowType } from '@/types/brain';
import { getCurrentUser } from '@/utils/handleAuth';

const useWorkflow = (b?: string) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [paginator, setPaginator] = useState<PaginatorType>({});
    const [workflowList, setWorkflowList] = useState<WorkflowType[]>([]);
    const brainId = useMemo(() => decodedObjectId(b), [b]);

    const createWorkflow = async (data, closeModal) => {
        try {
            const response = await commonApi({
                action: MODULE_ACTIONS.CREATE,
                prefix: MODULE_ACTIONS.WEB_PREFIX,
                module: MODULES.WORKFLOW,
                data,
                common: true
            });
            Toast(response.message);
            await getList();
            closeModal();
        } catch (error) {
            console.log('error: ', error);
        }
    }

    const getList = useCallback(async (searchValue = '', filterOptions = {}, pagination: DefaultPaginationType = { offset: 0, limit: 10 }) => {
        if (!b) {
            setLoading(false);
            return;
        }
        if (!brainId) {
            console.warn('useWorkflow: brainId is missing, cannot fetch workflows');
            setLoading(false);
            setWorkflowList([]);
            return;
        }
        try {
            setLoading(true);

            const response: APIResponseType<WorkflowType[]> = await commonApi({
                action: MODULE_ACTIONS.LIST,
                prefix: MODULE_ACTIONS.WEB_PREFIX,
                module: MODULES.WORKFLOW,
                common: true,
                data: {
                    options: {
                        sort: { createdAt: DEFAULT_SORT },
                        limit: pagination.limit || 10,
                        offset: pagination.offset || 0
                    },
                    query: {
                        searchColumns: [SEARCH_AND_FILTER_OPTIONS.NORMAL_NAME],
                        search: searchValue,
                        'brain.id': brainId,
                        ...filterOptions
                    },
                },
            });

            // Ensure response.data is an array
            const workflows = Array.isArray(response?.data) ? response.data : [];

            if (pagination.offset === 0) {
                setWorkflowList(workflows);
            } else {
                setWorkflowList((prev) => {
                    const updated = [...prev, ...workflows];
                    return updated;
                });
            }
            setPaginator(response.paginator as PaginatorType);

        } catch (error: any) {
            if (error?.response?.status === 302) {
                router.push('/')
            }
            console.error('useWorkflow getList error: ', error);
            setWorkflowList([]);
        } finally {
            setLoading(false);
        }
    }, [b, brainId, router]);

    const updateWorkflow = async (payload, closeModal, id) => {
        try {
            const response = await commonApi({
                parameters: [id],
                action: MODULE_ACTIONS.UPDATE,
                prefix: MODULE_ACTIONS.WEB_PREFIX,
                module: MODULES.WORKFLOW,
                common: true,
                data: payload
            });
            Toast(response.message);
            await getList();
            if (closeModal) closeModal();
        } catch (error) {
            console.error('error: ', error);
        }
    }

    const deleteWorkflow = async (id) => {
        try {
            const response = await commonApi({
                parameters: [id],
                action: MODULE_ACTIONS.DELETE,
                prefix: MODULE_ACTIONS.WEB_PREFIX,
                module: MODULES.WORKFLOW,
                common: true
            });
            Toast(response.message);
            setWorkflowList((prev) => prev.filter(w => w._id !== id));
        } catch (error) {
            console.error('error: ', error);
        }
    }

    const syncWorkflows = async (brainId) => {
        try {
            setLoading(true);
            const response = await commonApi({
                action: 'syncWorkflows',
                common: false,
                data: { brainId }
            });
            Toast(response.message);
            await getList();
        } catch (error) {
            console.error('error', error);
        } finally {
            setLoading(false);
        }
    }

    const executeWorkflow = async (id, params) => {
        try {
            const response = await commonApi({
                action: 'executeWorkflow',
                common: false,
                data: { id, params }
            });
            Toast(response.message);
            return response.data;
        } catch (error) {
            console.error('error', error);
            throw error;
        }
    }

    const saveToN8n = async (workflowJson: string, brainIdParam?: string, isUpdate: boolean = false) => {
        try {
            const targetBrainId = brainIdParam || brainId;
            if (!targetBrainId) {
                Toast('Please select a brain first', 'error');
                return null;
            }

            const response = await commonApi({
                action: 'saveWorkflowToN8n',
                common: false,
                data: { 
                    workflowJson, 
                    brainId: targetBrainId,
                    isUpdate 
                }
            });
            Toast(response.message);
            
            // Refresh the list if we have a brainId
            if (brainId) {
                await getList();
            }
            
            return response.data;
        } catch (error: any) {
            console.error('error', error);
            Toast(error?.response?.data?.message || 'Failed to save workflow to n8n', 'error');
            throw error;
        }
    }

    return {
        createWorkflow,
        getList,
        updateWorkflow,
        deleteWorkflow,
        syncWorkflows,
        executeWorkflow,
        saveToN8n,
        loading,
        workflowList,
        paginator,
        setWorkflowList
    };
};

export default useWorkflow;
