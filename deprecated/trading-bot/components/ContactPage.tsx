
import React, { useState } from 'react';
import { CONTACT_INFORMATION } from '../constants';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import ParallaxSection from './ParallaxSection';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';

const ContactPage: React.FC = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    // Basic validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        setSubmitError(t('error.allFieldsRequired'));
        return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setSubmitError(t('error.invalidEmail'));
        return;
    }

    // Mock submission
    console.log('Form data submitted:', formData);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setIsSubmitted(false), 5000); // Reset message after 5s
  };

  return (
    <div className="animate-fade-in-up">
       <ParallaxSection imageUrl="https://images.unsplash.com/photo-1580193769210-b8d1c049a7d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Y29udGFjdCUyMHVzfGVufDB8fDB8fHww&auto=format&fit=crop&w=1200&q=70" minHeight="min-h-[40vh]" overlayOpacity={0.65}>
        <h1 className="text-5xl font-bold text-white">{t('contactPage.title', {defaultValue: "Get In Touch"})}</h1>
        <p className="text-xl text-gray-200 mt-4 max-w-2xl">
          {t('contactPage.subtitle', {defaultValue: "We're here to help. Contact us for support, sales inquiries, or any questions."})}
        </p>
      </ParallaxSection>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <Card titleKey="contactPage.infoTitle" className="bg-light-card dark:bg-dark-card">
            <div className="space-y-4 text-light-text-secondary dark:text-dark-text-secondary">
              <p className="flex items-center">
                <FaEnvelope className="text-light-accent dark:text-dark-accent mr-3 h-5 w-5 flex-shrink-0" />
                {CONTACT_INFORMATION.email}
              </p>
              {CONTACT_INFORMATION.phone && (
                <p className="flex items-center">
                  <FaPhone className="text-light-accent dark:text-dark-accent mr-3 h-5 w-5 flex-shrink-0" />
                  {CONTACT_INFORMATION.phone}
                </p>
              )}
              {CONTACT_INFORMATION.address && (
                <p className="flex items-start">
                  <FaMapMarkerAlt className="text-light-accent dark:text-dark-accent mr-3 h-5 w-5 mt-1 flex-shrink-0" />
                  <span>{CONTACT_INFORMATION.address}</span>
                </p>
              )}
            </div>
            <div className="mt-6 pt-6 border-t border-light-border dark:border-dark-border">
                <h4 className="text-md font-semibold text-light-text dark:text-dark-text mb-2">{t('contactPage.officeHoursTitle', {defaultValue: "Office Hours"})}</h4>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('contactPage.officeHoursDays', {defaultValue: "Monday - Friday: 9:00 AM - 6:00 PM (UTC)"})}</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('contactPage.supportHours', {defaultValue: "Support: 24/7 via Email"})}</p>
            </div>
          </Card>

          <Card titleKey="contactPage.formTitle" className="bg-light-card dark:bg-dark-card">
            {isSubmitted ? (
              <div className="p-4 text-center bg-light-positive/10 dark:bg-dark-positive/20 border border-light-positive dark:border-dark-positive rounded-md">
                <p className="font-semibold text-light-positive dark:text-dark-positive">{t('contactPage.submitSuccessTitle', {defaultValue: "Thank you!"})}</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('contactPage.submitSuccessMessage', {defaultValue: "Your message has been sent. We'll get back to you shortly."})}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitError && <p className="text-center text-sm text-light-negative dark:text-dark-negative bg-light-negative/10 dark:bg-dark-negative/20 p-2 rounded">{submitError}</p>}
                <Input type="text" name="name" labelKey="contactPage.formNameLabel" value={formData.name} onChange={handleChange} placeholder={t('contactPage.formNamePlaceholder', {defaultValue: "John Doe"})} required />
                <Input type="email" name="email" labelKey="contactPage.formEmailLabel" value={formData.email} onChange={handleChange} placeholder={t('contactPage.formEmailPlaceholder', {defaultValue: "you@example.com"})} required />
                <Input type="text" name="subject" labelKey="contactPage.formSubjectLabel" value={formData.subject} onChange={handleChange} placeholder={t('contactPage.formSubjectPlaceholder', {defaultValue: "Inquiry about Pro Plan"})} required />
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{t('contactPage.formMessageLabel', {defaultValue: "Message"})}</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:ring-light-accent dark:focus:ring-dark-accent focus:border-light-accent dark:focus:border-dark-accent sm:text-sm text-light-text dark:text-dark-text"
                    placeholder={t('contactPage.formMessagePlaceholder', {defaultValue: "Your message..."})}
                    required
                  ></textarea>
                </div>
                <Button type="submit" variant="primary" fullWidth>{t('contactPage.formSubmitButton', {defaultValue: "Send Message"})}</Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;