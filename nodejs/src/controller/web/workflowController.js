/* eslint-disable no-undef */
const workflowService = require('../../services/workflow');

const WORKFLOW = 'workflow';

const addWorkflow = catchAsync(async (req, res) => {
    const result = await workflowService.addWorkflow(req);
    if (result) {
        res.message = _localize('module.create', req, WORKFLOW);
        return util.successResponse(result, res);
    }
    return util.failureResponse(_localize('module.createError', req, WORKFLOW), res);
});

const getWorkflowList = catchAsync(async (req, res) => {
    const result = await workflowService.getWorkflowList(req);

    if (result.status === 302) {
        res.message = _localize("module.unAuthorized", req, "Workflows");
        return util.redirectResponse(res);
    }

    if (result.data && result.data.length) {
        res.message = _localize('module.list', req, WORKFLOW);
        return util.successListResponse(result, res);
    }
    // Return empty list instead of 404 for consistent UI handling usually, or standard 404
    // promptController returns recordNotFound which usually creates a 200 with generic success false or specific code
    if (result.data && result.data.length === 0) {
        // If it's a list response but empty
        res.message = _localize('module.recordNotFound', req, WORKFLOW);
        // util.recordNotFound might return 200 with empty data or 404. 
        // promptController uses it.
        return util.recordNotFound(null, res);
    }

    res.message = _localize('module.recordNotFound', req, WORKFLOW);
    return util.recordNotFound(null, res);
});

const updateWorkflow = catchAsync(async (req, res) => {
    const result = await workflowService.updateWorkflow(req);
    res.message = _localize('module.update', req, WORKFLOW);
    return util.successResponse(result, res);
});

const deleteWorkflow = catchAsync(async (req, res) => {
    const result = await workflowService.deleteWorkflow(req);
    res.message = _localize('module.delete', req, WORKFLOW);
    return util.successResponse(result, res);
});

const syncWorkflows = catchAsync(async (req, res) => {
    const result = await workflowService.syncWorkflows(req);
    if (result) {
        res.message = "Workflows synced successfully";
        return util.successListResponse({ data: result }, res);
    }
    return util.failureResponse("Sync failed", res);
});

const executeWorkflow = catchAsync(async (req, res) => {
    const result = await workflowService.executeWorkflow(req);
    if (result && result.success) {
        res.message = "Workflow execution started";
        return util.successResponse(result, res);
    }
    return util.failureResponse("Execution failed", res);
});

const saveToN8n = catchAsync(async (req, res) => {
    const result = await workflowService.saveToN8n(req);
    if (result && result.success) {
        res.message = result.isNew ? "Workflow saved to n8n successfully" : "Workflow updated in n8n successfully";
        return util.successResponse(result, res);
    }
    return util.failureResponse("Failed to save workflow to n8n", res);
});

const usersWiseGetAll = catchAsync(async (req, res) => {
    const result = await workflowService.usersWiseGetAll(req);
    if (result.data.length) {
        res.message = _localize('module.list', req, WORKFLOW);
        return util.successListResponse(result, res);
    }
    res.message = _localize('module.notFound', req, WORKFLOW);
    return util.recordNotFound(null, res);
});

module.exports = {
    addWorkflow,
    getWorkflowList,
    updateWorkflow,
    deleteWorkflow,
    syncWorkflows,
    executeWorkflow,
    saveToN8n,
    usersWiseGetAll
};
