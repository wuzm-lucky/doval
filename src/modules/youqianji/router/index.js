import { LAYOUT } from '@framework/utils/route/constant';
import { ChartPieIcon, WalletIcon } from 'tdesign-icons-vue-next';
import { shallowRef } from 'vue';

/** 有钱记首批概览与账户路由。 */
export default [
  {
    path: '/youqianji',
    name: 'Youqianji',
    component: LAYOUT,
    redirect: '/youqianji/overview',
    meta: { title: { zh_CN: '有钱记', en_US: 'Money Ledger' }, icon: shallowRef(WalletIcon), orderNo: 20 },
    children: [
      {
        path: 'overview',
        name: 'YouqianjiOverview',
        component: () => import('@youqianji/pages/overview/index.vue'),
        meta: { title: { zh_CN: '资产概览', en_US: 'Overview' }, icon: shallowRef(ChartPieIcon) },
      },
      {
        path: 'account',
        name: 'YouqianjiAccount',
        component: () => import('@youqianji/pages/account/index.vue'),
        meta: { title: { zh_CN: '账户', en_US: 'Accounts' } },
      },
      {
        path: 'transaction',
        name: 'YouqianjiTransaction',
        component: () => import('@youqianji/pages/transaction/index.vue'),
        meta: { title: { zh_CN: '流水', en_US: 'Transactions' } },
      },
      {
        path: 'transaction/create',
        name: 'YouqianjiTransactionCreate',
        component: () => import('@youqianji/pages/transaction/create.vue'),
        meta: { title: { zh_CN: '资金变更', en_US: 'Money Movement' } },
      },
      {
        path: 'transaction/post',
        name: 'YouqianjiTransactionPost',
        component: () => import('@youqianji/pages/transaction/post.vue'),
        meta: { title: { zh_CN: '收入支出记账', en_US: 'Income Expense Post' } },
      },
      {
        path: 'transaction/exchange',
        name: 'YouqianjiExchange',
        component: () => import('@youqianji/pages/transaction/exchange.vue'),
        meta: { title: { zh_CN: '跨币种换汇', en_US: 'Currency Exchange' } },
      },
      {
        path: 'transaction/refund',
        name: 'YouqianjiRefund',
        component: () => import('@youqianji/pages/transaction/refund.vue'),
        meta: { title: { zh_CN: '支出退款', en_US: 'Expense Refund' } },
      },
      {
        path: 'snapshot',
        name: 'YouqianjiSnapshot',
        component: () => import('@youqianji/pages/snapshot/index.vue'),
        meta: { title: { zh_CN: '账户快照', en_US: 'Snapshots' } },
      },
      {
        path: 'report',
        name: 'YouqianjiReport',
        component: () => import('@youqianji/pages/report/index.vue'),
        meta: { title: { zh_CN: '资产报表', en_US: 'Reports' } },
      },
      {
        path: 'receivable-payable',
        name: 'YouqianjiReceivablePayable',
        component: () => import('@youqianji/pages/receivable-payable/index.vue'),
        meta: { title: { zh_CN: '应收应付', en_US: 'Receivable Payable' } },
      },
      {
        path: 'receivable-payable/create',
        name: 'YouqianjiLoanCreate',
        component: () => import('@youqianji/pages/receivable-payable/create.vue'),
        meta: { title: { zh_CN: '借入借出', en_US: 'Loan Create' } },
      },
      {
        path: 'receivable-payable/settle',
        name: 'YouqianjiLoanSettle',
        component: () => import('@youqianji/pages/receivable-payable/settle.vue'),
        meta: { title: { zh_CN: '收款还款', en_US: 'Loan Settle' } },
      },
      {
        path: 'plan',
        name: 'YouqianjiPlan',
        component: () => import('@youqianji/pages/plan/index.vue'),
        meta: { title: { zh_CN: '收支计划', en_US: 'Plans' } },
      },
      {
        path: 'plan/create',
        name: 'YouqianjiPlanCreate',
        component: () => import('@youqianji/pages/plan/create.vue'),
        meta: { title: { zh_CN: '创建计划', en_US: 'Plan Create' } },
      },
      {
        path: 'plan/instance/create',
        name: 'YouqianjiPlanInstanceCreate',
        component: () => import('@youqianji/pages/plan/instance-create.vue'),
        meta: { title: { zh_CN: '创建计划周期', en_US: 'Plan Instance Create' } },
      },
      {
        path: 'plan/match',
        name: 'YouqianjiPlanMatch',
        component: () => import('@youqianji/pages/plan/match.vue'),
        meta: { title: { zh_CN: '匹配计划流水', en_US: 'Plan Match' } },
      },
      {
        path: 'transaction/:id',
        name: 'YouqianjiTransactionDetail',
        component: () => import('@youqianji/pages/transaction/detail.vue'),
        meta: { title: { zh_CN: '流水详情', en_US: 'Transaction Detail' } },
      },
    ],
  },
];
