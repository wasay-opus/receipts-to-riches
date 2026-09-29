import type { TFunction } from 'i18next';
import * as Yup from 'yup';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const loginValidationSchema = (t: TFunction) =>
  Yup.object().shape({
    email: Yup.string()
      .email(t('validation.validEmail'))
      .required(t('validation.emailRequired'))
      .matches(EMAIL_REGEX, t('validation.invalidEmailAddress')),
    password: Yup.string()
      .min(8, t('validation.passwordMin8'))
      .required(t('validation.passwordRequired')),
  });

export const signUpValidationSchema = (t: TFunction) =>
  Yup.object().shape({
    first_name: Yup.string()
      .trim()
      .required(t('validation.firstNameRequired'))
      .min(2, t('validation.enterAtLeast2Characters'))
      .max(15, t('validation.firstNameMax15Characters')),

    last_name: Yup.string()
      .trim()
      .required(t('validation.lastNameRequired'))
      .min(2, t('validation.enterAtLeast2Characters'))
      .max(15, t('validation.lastNameMax15Characters')),
    email: Yup.string()
      .trim()
      .email(t('validation.invalidEmail'))
      .required(t('validation.emailRequired'))
      .matches(EMAIL_REGEX, t('validation.invalidEmailAddress')),
    phone_number: Yup.string()
      .required(t('validation.phoneNumberRequired'))
      .matches(/^\+?[0-9]{8,15}$/, t('validation.validPhoneNumber')),
    password: Yup.string()
      .min(8, t('validation.passwordMin8'))
      .required(t('validation.passwordRequired')),
    confirm_password: Yup.string()
      .oneOf([Yup.ref('password')], t('validation.passwordsMustMatch'))
      .required(t('validation.confirmPasswordRequired')),
  });

export const secretQuestionValidationSchema = (t: TFunction) =>
  Yup.object().shape({
    Question: Yup.string().required(t('validation.securityQuestionRequired')),
    Answer: Yup.string().required(t('validation.securityAnswerRequired')),
  });

export const basicInfoValidationSchema = (t: TFunction) =>
  Yup.object().shape({
    // Title: Yup.string(),
    BirthDate: Yup.string()
      .required(t('validation.dateOfBirthRequired'))
      .test(
        'is-at-least-thirteen-years-old',
        t('validation.dateOfBirthMustBeAtLeastThirteenYearsOld'),
        value => {
          if (!value) {
            return false;
          }

          const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (!match) {
            return false;
          }

          const month = Number(match[1]) - 1;
          const day = Number(match[2]);
          const year = Number(match[3]);
          const birthDate = new Date(year, month, day);

          if (Number.isNaN(birthDate.getTime())) {
            return false;
          }

          const thirteenYearsAgo = new Date();
          thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
          return birthDate <= thirteenYearsAgo;
        },
      ),
    Address1: Yup.string().required(t('validation.streetAddressRequired')),
    Address2: Yup.string(),
    City: Yup.string().required(t('validation.cityRequired')),
    State: Yup.string().required(t('validation.stateRequired')),
    Zip: Yup.string()
      .required(t('validation.zipCodeRequired'))
      .matches(/^\d{5}$/, t('validation.invalidUsZipCode')),
  });

export const emailValidationSchema = (t: TFunction) =>
  Yup.object().shape({
    email: Yup.string()
      .trim()
      .required(t('validation.emailRequired'))
      .email(t('validation.validEmailAddress'))
      .matches(EMAIL_REGEX, t('validation.invalidEmailAddress')),
  });

export const editProfileValidationSchema = (t: TFunction) =>
  Yup.object().shape({
    firstName: Yup.string()
      .required(t('validation.firstNameRequired'))
      .min(2, t('validation.enterAtLeast2Characters'))
      .max(30, t('validation.firstNameMax15Characters')),

    lastName: Yup.string()
      .required(t('validation.lastNameRequired'))
      .min(2, t('validation.enterAtLeast2Characters'))
      .max(30, t('validation.lastNameMax15Characters')),

    email: Yup.string()
      .email(t('validation.invalidEmailAddress'))
      .required(t('validation.emailRequired')),

    phone: Yup.string()
      .matches(/^[0-9+\-\s()]*$/, t('validation.invalidPhoneNumber')),

    bio: Yup.string().max(160, 'Bio must be at most 160 characters'),
    location: Yup.string().max(60, 'Location must be at most 60 characters'),

    oldPassword: Yup.string().min(6, t('validation.oldPasswordMin6')),

    newPassword: Yup.string().min(6, t('validation.newPasswordMin6')),

    confirmPassword: Yup.string().min(6, t('validation.confirmPasswordMin6')),
  });

export const AddMemberSchema = (t: TFunction) =>
  Yup.object().shape({
    name: Yup.string()
      .min(2, t('validation.nameMin2Characters'))
      .required(t('validation.nameRequired')),
    relation: Yup.string().required(t('validation.relationRequired')),
  });

export const validationSchema = (t: TFunction) =>
  Yup.object().shape({
    first_name: Yup.string().required(t('validation.firstNameRequired')),
    last_name: Yup.string().required(t('validation.lastNameRequired')),
    phone_number: Yup.string()
      .matches(/^\d+$/, t('validation.onlyDigitsAllowed'))
      .min(8, t('validation.phoneTooShort'))
      .required(t('validation.phoneNumberRequired')),
  });

export const ChangePasswordSchema = (t: TFunction) =>
  Yup.object().shape({
    currentPassword: Yup.string()
      .required(t('validation.currentPasswordRequired'))
      .min(6, t('validation.passwordMin6')),
    newPassword: Yup.string()
      .required(t('validation.newPasswordRequired'))
      .min(6, t('validation.passwordMin6'))
      .notOneOf(
        [Yup.ref('currentPassword')],
        t('validation.newPasswordDifferent'),
      ),
    confirmPassword: Yup.string()
      .required(t('validation.confirmPasswordRequired'))
      .oneOf([Yup.ref('newPassword')], t('validation.passwordsMustMatch')),
  });
