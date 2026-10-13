
export interface Episode {
  id: string;
  title: string;
  description: string;
  duration: string;
  categoryId: string;
  audioUrl?: string;
  script?: string;
  outline?: string[];
  level: 'مبتدئ' | 'متوسط' | 'متقدم';
  publishDate: string;
  officialLink: string;
}

export interface Category {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: string;
  description: string;
  episodeCount: number;
}

export interface NewsUpdate {
  id: string;
  titleAr: string;
  date: string;
  sourceUrl: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
