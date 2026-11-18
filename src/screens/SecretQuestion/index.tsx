import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { KeyRound, CheckCircle, Calendar, MapPin } from 'lucide-react';
import { Button, FormInput, showToast } from '../../components';
import { getUserFriendlyErrorMessage } from '../../utils/errorMessages';
import images from '../../constants/images';
import { AppDispatch, RootState } from '../../redux/Store';
import { completeProfile } from '../../redux/Slices/authSlice';
import { updateUserDataLocally } from '../../redux/Slices/userSlice';

const SECRET_QUESTIONS = [
  { value: 'What was your first pet’s name?', key: 'firstPetName' },
  { value: 'In what city were you born?', key: 'birthCity' },
  { value: 'What is your mother’s maiden name?', key: 'motherMaidenName' },
  { value: 'What was the make of your first car?', key: 'firstCarMake' },
  { value: 'What was the name of your elementary school?', key: 'elementarySchool' },
];

export const SecretQuestion: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { userData } = useSelector((state: RootState) => state.user);
  const isProfileComplete = useSelector((state: RootState) => state.auth?.isProfile);
  const { token, isRegister } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const hasCompleted =
      sessionStorage.getItem('profile_completed_just_now') === 'true' ||
      userData?.is_profile_complete === true ||
      userData?.is_profile_complete === 1 ||
      userData?.is_profile_complete === '1' ||
      isProfileComplete === true;

    if (!token) {
      navigate('/signin', { replace: true });
    } else if (hasCompleted || !isRegister) {
      navigate('/', { replace: true });
    }
  }, [userData, isProfileComplete, isRegister, token, navigate]);

  const validationSchema = Yup.object().shape({
    title: Yup.string().required(t('validation.required', 'Title is required')),
    dob: Yup.string().required(t('validation.required', 'Date of birth is required')),
    address: Yup.string().required(t('validation.required', 'Address is required')),
    apartment: Yup.string(),
    city: Yup.string().required(t('validation.required', 'City is required')),
    state: Yup.string().required(t('validation.required', 'State is required')),
    zip_code: Yup.string().required(t('validation.required', 'Zip code is required')),
    question: Yup.string().required(t('validation.required', 'Please select a question')),
    answer: Yup.string().min(2, t('secretQuestion.answerTooShort', 'Answer is too short')).required(t('validation.required', 'Answer is required')),
  });

  const handleSubmit = async (values: {
    title: string;
    dob: string;
    address: string;
    apartment: string;
    city: string;
    state: string;
    zip_code: string;
    question: string;
    answer: string;
  }) => {
    try {
      await dispatch(
        completeProfile({
          title: values.title,
          dob: values.dob,
          address: values.address,
          apartment: values.apartment,
          city: values.city,
          state: values.state,
          zip_code: values.zip_code,
          question_text: values.question,
          answer: values.answer,
        }),
      ).unwrap();

      try {
        sessionStorage.setItem('profile_completed_just_now', 'true');
      } catch {}
      dispatch(updateUserDataLocally({ is_profile_complete: true }));

      showToast({
        type: 'success',
        text1: t('auth.securityUpdated', 'Profile Completed'),
        text2: t('auth.profileSecured', 'Your profile has been saved.'),
      });
      navigate('/', { replace: true });
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('secretQuestion.saveFailed', 'Could not save profile'),
        text2: getUserFriendlyErrorMessage(
          error,
          t('secretQuestion.checkDetailsTryAgain', 'Please check your details and try again.'),
        ),
      });
    }
  };

  return (
    <div
      className="r2r-login-page secret-question-page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '24px 16px 40px',
        background: 'transparent',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div
        className="card auth-card secret-question-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          borderRadius: '26px',
          background: '#FFFFFF',
          border: '1px solid rgba(0, 77, 54, 0.08)',
          boxShadow: '0 24px 60px rgba(0, 77, 54, 0.12), 0 6px 18px rgba(0, 77, 54, 0.05)',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <img src={images.SplashLogo} alt="Logo" style={{ width: '72px', height: '72px', objectFit: 'contain' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px', marginBottom: '2px' }}>
            {t('auth.completeProfile', 'Complete Your Profile')}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
            {t('auth.completeProfileSubtitle', 'A few more details to set up your account')}
          </p>
        </div>

        <Formik
          initialValues={{
            title: 'Mr',
            dob: '',
            address: '',
            apartment: '',
            city: '',
            state: '',
            zip_code: '',
            question: SECRET_QUESTIONS[0].value,
            answer: '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
            <form className="secret-question-form" onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>
                  {t('auth.title', 'Title')}
                  <select name="title" value={values.title} onChange={handleChange('title')} className="form-input">
                    <option value="Mr">{t('dropdowns.titles.mr', 'Mr.')}</option>
                    <option value="Mrs">{t('dropdowns.titles.mrs', 'Mrs.')}</option>
                    <option value="Ms">{t('dropdowns.titles.ms', 'Ms.')}</option>
                    <option value="Dr">{t('dropdowns.titles.dr', 'Dr.')}</option>
                  </select>
                </label>

                <FormInput
                  label={t('auth.dob', 'Date of Birth')}
                  type="date"
                  name="dob"
                  value={values.dob}
                  onChange={handleChange('dob')}
                  onBlur={handleBlur('dob')}
                  error={touched.dob && errors.dob ? errors.dob : undefined}
                  leftIcon={<Calendar size={18} />}
                />
              </div>

              <FormInput
                label={t('auth.address', 'Address')}
                placeholder="123 Main Street"
                name="address"
                value={values.address}
                onChange={handleChange('address')}
                onBlur={handleBlur('address')}
                error={touched.address && errors.address ? errors.address : undefined}
                leftIcon={<MapPin size={18} />}
              />

              <FormInput
                label={t('auth.apartment', 'Apartment / Suite (optional)')}
                placeholder="4B"
                name="apartment"
                value={values.apartment}
                onChange={handleChange('apartment')}
                onBlur={handleBlur('apartment')}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <FormInput
                  label={t('auth.city', 'City')}
                  placeholder="Dallas"
                  name="city"
                  value={values.city}
                  onChange={handleChange('city')}
                  onBlur={handleBlur('city')}
                  error={touched.city && errors.city ? errors.city : undefined}
                />
                <FormInput
                  label={t('auth.state', 'State')}
                  placeholder="Texas"
                  name="state"
                  value={values.state}
                  onChange={handleChange('state')}
                  onBlur={handleBlur('state')}
                  error={touched.state && errors.state ? errors.state : undefined}
                />
                <FormInput
                  label={t('auth.zipCode', 'Zip Code')}
                  placeholder="75201"
                  name="zip_code"
                  value={values.zip_code}
                  onChange={handleChange('zip_code')}
                  onBlur={handleBlur('zip_code')}
                  error={touched.zip_code && errors.zip_code ? errors.zip_code : undefined}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>
                  {t('auth.selectQuestion', 'Select Security Question')}
                </label>
                <select
                  name="question"
                  value={values.question}
                  onChange={handleChange('question')}
                  className="form-input"
                  style={{ cursor: 'pointer' }}
                >
                  {SECRET_QUESTIONS.map((q, idx) => (
                    <option key={idx} value={q.value}>
                      {t(`secretQuestion.questions.${q.key}`, q.value)}
                    </option>
                  ))}
                </select>
              </div>

              <FormInput
                label={t('auth.yourAnswer', 'Your Answer')}
                placeholder="Enter your answer"
                name="answer"
                value={values.answer}
                onChange={handleChange('answer')}
                onBlur={handleBlur('answer')}
                error={touched.answer && errors.answer ? errors.answer : undefined}
                leftIcon={<KeyRound size={18} />}
              />

              <Button
                type="submit"
                loading={isSubmitting}
                title={t('common.saveAndContinue', 'Save & Continue')}
                icon={<CheckCircle size={18} />}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default SecretQuestion;
