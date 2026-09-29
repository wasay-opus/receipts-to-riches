export interface CreatePostPayload {
  caption: string;
  imageUri?: string;
  location?: string;
  winningsAmount?: string;
  tag?: string;
}

export interface QuickTagItem {
  id: string;
  label: string;
  emoji: string;
}
