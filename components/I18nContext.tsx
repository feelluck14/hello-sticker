'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

type Locale = 'ko' | 'en';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messages = {
  ko: {
    nav: {
      title: "이모티콘 만들기",
      myPage: "마이페이지",
      logout: "로그아웃",
      login: "로그인"
    },
    auth: {
      login: "로그인",
      signup: "회원가입",
      email: "이메일",
      password: "비밀번호",
      rememberMe: "항시 로그인 유지",
      noAccount: "계정이 없으신가요?",
      signupLink: "회원가입",
      hasAccount: "이미 계정이 있으신가요?",
      loginLink: "로그인",
      name: "이름",
      phone: "휴대폰번호",
      gender: "성별",
      birth: "생년월일",
      nickname: "닉네임",
      checkDuplicate: "중복체크",
      googleLogin: "Google로 계속하기",
      male: "남성",
      female: "여성",
      select: "선택"
    },
    main: {
      create: "만들기",
      gallery: "갤러리",
      emojiAlt: "이모티콘"
    },
    contestCreate: {
      loginRequired: "로그인이 필요합니다.",
      noUserInfo: "사용자 정보가 없습니다. 새로고침 후 다시 시도해주세요.",
      uploadFail: "이미지 업로드 실패",
      postFail: "게시글 등록 실패",
      title: "새로운 대회 만들기",
      titleLabel: "제목",
      titlePlaceholder: "제목을 입력하세요",
      imageLabel: "이미지 (선택)",
      bodyLabel: "본문",
      bodyPlaceholder: "내용을 입력하세요",
      submit: "등록하기"
    },
    imageBoard: {
      title: "📸 이미지 게시판",
      sortByLikes: "좋아요순",
      sortByLatest: "최신순",
      postImageAlt: "게시글 이미지",
      author: "작성자:",
      likes: "❤️ 좋아요:"
    },
    myPage: {
      loginRequired: "로그인이 필요합니다.",
      enterNickname: "닉네임을 입력해주세요.",
      nicknameCheckFail: "닉네임 체크 실패:",
      nicknameTaken: "이미 사용중인 닉네임입니다.",
      enterNameAndNickname: "이름과 닉네임을 입력해주세요.",
      checkNicknameDuplicate: "닉네임 중복 체크를 해주세요.",
      profileUpdateFail: "프로필 업데이트 실패:",
      profileUpdated: "프로필이 업데이트되었습니다.",
      title: "마이페이지",
      edit: "수정",
      profileInfo: "프로필 정보",
      name: "이름",
      nickname: "닉네임",
      checkDuplicate: "중복체크",
      nicknameAvailable: "사용 가능한 닉네임입니다.",
      phone: "휴대폰",
      birth: "생년월일",
      save: "저장",
      cancel: "취소",
      nameLabel: "이름:",
      emailLabel: "이메일:",
      nicknameLabel: "닉네임:",
      phoneLabel: "휴대폰:",
      birthLabel: "생년월일:",
      myWorks: "내가 만든 작품",
      likedWorks: "좋아요한 작품",
      noWorks: "아직 만든 작품이 없습니다.",
      workAlt: "작품",
      noLikedWorks: "아직 좋아요한 작품이 없습니다.",
      likedWorkAlt: "좋아요한 작품"
    },
    imageCreate: {
      fetchFail: "조회 실패",
      limitExceeded: "오늘 횟수 초과",
      making: "만들기 진행",
      limitExceededAnon: "오늘 횟수 초과 (비회원)",
      loadImagesFail: "이미지 불러오기 실패",
      inputRequired: "이미지와 프롬프트를 모두 입력해주세요.",
      saveFail: "저장 실패",
      saveSuccess: "이미지 생성 및 저장 완료!",
      saveSuccessAnon: "이미지 생성 완료 (비회원 저장됨)",
      loginRequired: "로그인 후 이용해주세요",
      noResultImage: "결과 이미지가 없습니다.",
      noUserInfo: "사용자 정보가 없습니다.",
      uploadFail: "이미지 업로드 실패",
      uploadSuccess: "이미지 게시 완료!",
      postImageAlt: "게시글 이미지",
      createdAt: "작성일:",
      character: "캐릭터",
      selectedCharacterAlt: "선택된 캐릭터",
      plus: "＋",
      promptLabel: "프롬프트 입력",
      generate: "만들기"
    },
    imageDetail: {
      emojiAlt: "이모티콘",
      author: "작성자 ID:",
      commentSection: "댓글 작성",
      commentPlaceholder: "댓글을 입력하세요",
      submit: "등록",
      commentList: "댓글 목록",
      close: "닫기",
      reply: "답글 달기",
      replyPlaceholder: "답글을 입력하세요",
      submitReply: "답글 등록"
    }
  },
  en: {
    nav: {
      title: "Create Sticker",
      myPage: "My Page",
      logout: "Logout",
      login: "Login"
    },
    auth: {
      login: "Login",
      signup: "Sign Up",
      email: "Email",
      password: "Password",
      rememberMe: "Remember Me",
      noAccount: "Don't have an account?",
      signupLink: "Sign Up",
      hasAccount: "Already have an account?",
      loginLink: "Login",
      name: "Name",
      phone: "Phone Number",
      gender: "Gender",
      birth: "Date of Birth",
      nickname: "Nickname",
      checkDuplicate: "Check Duplicate",
      googleLogin: "Continue with Google",
      male: "Male",
      female: "Female",
      select: "Select"
    },
    main: {
      create: "Create",
      gallery: "Gallery",
      emojiAlt: "Emoji"
    },
    contestCreate: {
      loginRequired: "Login is required.",
      noUserInfo: "User information is not available. Please refresh and try again.",
      uploadFail: "Image upload failed",
      postFail: "Post registration failed",
      title: "Create New Contest",
      titleLabel: "Title",
      titlePlaceholder: "Enter title",
      imageLabel: "Image (Optional)",
      bodyLabel: "Body",
      bodyPlaceholder: "Enter content",
      submit: "Submit"
    },
    imageBoard: {
      title: "📸 Image Board",
      sortByLikes: "By Likes",
      sortByLatest: "By Latest",
      postImageAlt: "Post image",
      author: "Author:",
      likes: "❤️ Likes:"
    },
    myPage: {
      loginRequired: "Login is required.",
      enterNickname: "Please enter a nickname.",
      nicknameCheckFail: "Nickname check failed:",
      nicknameTaken: "This nickname is already taken.",
      enterNameAndNickname: "Please enter both name and nickname.",
      checkNicknameDuplicate: "Please check nickname availability.",
      profileUpdateFail: "Profile update failed:",
      profileUpdated: "Profile has been updated.",
      title: "My Page",
      edit: "Edit",
      profileInfo: "Profile Information",
      name: "Name",
      nickname: "Nickname",
      checkDuplicate: "Check Duplicate",
      nicknameAvailable: "This nickname is available.",
      phone: "Phone",
      birth: "Date of Birth",
      save: "Save",
      cancel: "Cancel",
      nameLabel: "Name:",
      emailLabel: "Email:",
      nicknameLabel: "Nickname:",
      phoneLabel: "Phone:",
      birthLabel: "Date of Birth:",
      myWorks: "My Works",
      likedWorks: "Liked Works",
      noWorks: "No works created yet.",
      workAlt: "Work",
      noLikedWorks: "No liked works yet.",
      likedWorkAlt: "Liked work"
    },
    imageCreate: {
      fetchFail: "Query failed",
      limitExceeded: "Daily limit exceeded",
      making: "Generating",
      limitExceededAnon: "Daily limit exceeded (Guest)",
      loadImagesFail: "Failed to load images",
      inputRequired: "Please enter both image and prompt.",
      saveFail: "Save failed",
      saveSuccess: "Image generated and saved!",
      saveSuccessAnon: "Image generated (Saved for guest)",
      loginRequired: "Please log in to use",
      noResultImage: "No result image.",
      noUserInfo: "User information not available.",
      uploadFail: "Image upload failed",
      uploadSuccess: "Image posted!",
      postImageAlt: "Post image",
      createdAt: "Created at:",
      character: "Character",
      selectedCharacterAlt: "Selected character",
      plus: "+",
      promptLabel: "Prompt input",
      generate: "Generate"
    },
    imageDetail: {
      emojiAlt: "Emoji",
      author: "Author ID:",
      commentSection: "Write Comment",
      commentPlaceholder: "Enter comment",
      submit: "Submit",
      commentList: "Comment List",
      close: "Close",
      reply: "Reply",
      replyPlaceholder: "Enter reply",
      submitReply: "Submit Reply"
    }
  }
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ko');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && ['ko', 'en'].includes(savedLocale)) {
      setLocale(savedLocale);
    }
  }, []);

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = messages[locale];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}