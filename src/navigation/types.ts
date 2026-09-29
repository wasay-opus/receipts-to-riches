export type RootStackParamList = {
  SIGN_IN: undefined;
  SIGN_UP: { someParam: string };
  SECRET_QUESTION: { someParam: string };
};

export type NavigateParams = {
  name: keyof RootStackParamList;
  params?: any;
};
