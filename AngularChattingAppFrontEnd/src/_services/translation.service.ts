import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private currentLang = 'en';

  private translations = {
    en: {
      appName: 'ChatBridge',
      exploreMembers: 'Explore Members',
      favourites: 'Favourites',
      messages: 'Messages',
      login: 'Login',
      profile: 'Profile',
      editProfile: 'Edit Profile',
      logout: 'Logout',
      conversations: '💬 Your Conversations',
      back: 'Back',
      sendMessage: 'Send Message',
      typeMessage: 'Type your message...',
      deleteMessage: 'Are you sure you want to delete this message?',
      today: 'Today',
      yesterday: 'Yesterday',
      typing: 'is typing...',
      startChat: 'Start Chat',
      noConversations: 'No conversations yet',
      noLikedUsers: 'No liked users yet',
    },
    ar: {
      appName: 'شات بريدج',
      exploreMembers: 'استكشف الأعضاء',
      favourites: 'المفضلة',
      messages: 'الرسائل',
      login: 'تسجيل الدخول',
      profile: 'الملف الشخصي',
      editProfile: 'تعديل الملف الشخصي',
      logout: 'تسجيل الخروج',
      conversations: '💬 محادثاتك',
      back: 'رجوع',
      sendMessage: 'إرسال رسالة',
      typeMessage: 'اكتب رسالة...',
      deleteMessage: 'هل أنت متأكد من حذف هذه الرسالة؟',
      today: 'اليوم',
      yesterday: 'أمس',
      typing: 'يكتب...',
      startChat: 'ابدأ محادثة',
      noConversations: 'لا توجد محادثات بعد',
      noLikedUsers: 'لا يوجد مستخدمين محبوبين بعد',
    },
  };

  constructor() {
    this.currentLang = localStorage.getItem('preferredLanguage') || 'en';
  }

  getCurrentLang(): string {
    return this.currentLang;
  }

  setLanguage(lang: string) {
    this.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
  }

  translate(key: string): string {
    return (
      this.translations[this.currentLang as keyof typeof this.translations]?.[
        key as keyof typeof this.translations.en
      ] || key
    );
  }

  getTranslations() {
    return this.translations[
      this.currentLang as keyof typeof this.translations
    ];
  }
}
