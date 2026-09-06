import { request } from '@framework/utils/request';

const prefix = '/youqianji';

/** 有钱记接口统一封装，页面不得散落硬编码接口地址。 */
export const youqianjiApi = {
  listFamilyMembers: () => request.get({ url: `${prefix}/family/member/list` }),
  listSubjects: (familyId) => request.get({ url: `${prefix}/subject/list`, params: { familyId } }),
  listCategories: (familyId) => request.get({ url: `${prefix}/category/list`, params: { familyId } }),
  listAccounts: (familyId) => request.get({ url: `${prefix}/account/list`, params: { familyId } }),
  listAccountPostingSubjects: (familyId) => request.get({ url: `${prefix}/posting-subject/account/list`, params: { familyId } }),
  getAssetReport: (params) => request.get({ url: `${prefix}/report/asset`, params }),
  getIncomeExpenseReport: (params) => request.get({ url: `${prefix}/report/income-expense`, params }),
  getReceivablePayableReport: (params) => request.get({ url: `${prefix}/report/receivable-payable`, params }),
  listAssetTrend: (params) => request.get({ url: `${prefix}/report/asset-trend`, params }),
  getOwnershipReport: (params) => request.get({ url: `${prefix}/report/ownership`, params }),
  listTransactions: (params) => request.get({ url: `${prefix}/transaction/list`, params }),
  pageTransactions: (params) => request.get({ url: `${prefix}/transaction/pagelist`, params }),
  getTransaction: (id) => request.get({ url: `${prefix}/transaction/get/${id}` }),
  postTransaction: (data) => request.post({ url: `${prefix}/transaction/post`, data }),
  transfer: (data) => request.post({ url: `${prefix}/transaction/transfer`, data }),
  exchange: (data) => request.post({ url: `${prefix}/transaction/exchange`, data }),
  refund: (data) => request.post({ url: `${prefix}/transaction/refund`, data }),
  reversal: (data) => request.post({ url: `${prefix}/transaction/reversal`, data }),
  listSnapshots: (params) => request.get({ url: `${prefix}/snapshot/list`, params }),
  postSnapshot: (data) => request.post({ url: `${prefix}/snapshot/post`, data }),
  listReceivablePayables: (familyId) => request.get({ url: `${prefix}/receivable-payable/list`, params: { familyId } }),
  listPlanTemplates: (familyId) => request.get({ url: `${prefix}/plan/template/list`, params: { familyId } }),
  listPlanInstances: (familyId) => request.get({ url: `${prefix}/plan/instance/list`, params: { familyId } }),
  createLoan: (data) => request.post({ url: `${prefix}/receivable-payable/loan`, data }),
  postLoanSettlement: (data) => request.post({ url: `${prefix}/receivable-payable/settle-post`, data }),
  createPlanTemplate: (data) => request.post({ url: `${prefix}/plan/template/create`, data }),
  createPlanInstance: (data) => request.post({ url: `${prefix}/plan/instance/create`, data }),
  matchPlan: (id, data) => request.post({ url: `${prefix}/plan/instance/${id}/match`, data }),
};
