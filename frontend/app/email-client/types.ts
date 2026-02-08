export type EmailAttachment = {
  filename: string;
  size?: string | null;
  download_url?: string | null;
};

export type Email = {
  id: number;
  sender_name: string;
  sender_email: string;
  to_name: string;
  to_email: string;
  subject: string;
  preview: string;
  body: string;
  received_at: string;
  is_read: boolean;
  is_archived: boolean;
  attachments?: EmailAttachment[];
};
