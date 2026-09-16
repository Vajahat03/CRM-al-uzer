export interface SMSSettings {
  id: string;
  enabled: boolean;
  minDaysOverdue: number; // e.g. 5 days
  reminderFrequencyDays: number; // e.g. every 5 days
  reminderTime: string; // e.g. "10:00 AM"
  maxReminders: number; // e.g. 3
  messageTemplate: string;
  businessName: string;
  gatewayApiKey?: string;
  gatewayDeviceName?: string;
  gatewayLastSeen?: string;
  updated_at?: string;
}

export type SMSStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface SMSQueueItem {
  id: string;
  customer_id: string;
  customer_name: string;
  phone_number: string;
  message: string;
  balance: number;
  days_overdue: number;
  work_type: string;
  status: SMSStatus;
  scheduled_at: string;
  attempts: number;
  created_at: string;
  sent_at?: string;
  error_message?: string;
}

export interface SMSLogItem {
  id: string;
  customer_id: string;
  customer_name: string;
  phone_number: string;
  message: string;
  balance: number;
  status: SMSStatus;
  sent_at: string;
  error_message?: string;
  created_at: string;
}

export interface SMSRuleAuditResult {
  totalDebtors: number;
  eligibleDebtors: {
    customer_id: string;
    customer_name: string;
    phone_number: string;
    balance: number;
    days_overdue: number;
    work_type: string;
    created_at: string;
    reason: string;
  }[];
  skippedDebtors: {
    customer_name: string;
    balance: number;
    days_overdue: number;
    reason: string;
  }[];
}
