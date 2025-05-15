'use client'

import { useState, FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Mail, Phone, MapPin, Clock, Send, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ContactPage() {
  const t = useTranslations('Contact')
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [verificationError, setVerificationError] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const resetForm = () => {
    setName('')
    setEmail('')
    setPhone('')
    setSubject('')
    setMessage('')
    setIsVerified(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!isVerified) {
      // Send verification code to email
      setIsSubmitting(true)
      
      try {
        // Simulate API call to send verification code
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setShowVerification(true)
        setSentEmail(email)
        toast.success("Verification code sent to your email")
      } catch (error) {
        toast.error(t('form.error'))
      } finally {
        setIsSubmitting(false)
      }
      
      return
    }
    
    // Process the form submission after verification
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(t('form.success'))
      resetForm()
    } catch (error) {
      toast.error(t('form.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = async () => {
    setVerificationError(false)
    setIsVerifying(true)
    
    try {
      // Simulate API call to verify code
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // For demo, let's say 123456 is the valid code
      if (verificationCode === '123456') {
        setIsVerified(true)
        setShowVerification(false)
        toast.success(t('form.verification.success'))
      } else {
        setVerificationError(true)
        toast.error(t('form.verification.error'))
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const resendCode = async () => {
    toast.info("A new verification code has been sent to your email")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground mb-8">{t('subtitle')}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  {isVerified ? t('form.message') : t('form.verifyEmail')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">
                        {t('form.name')}
                      </label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('form.namePlaceholder')}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        {t('form.email')}
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('form.emailPlaceholder')}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">
                        {t('form.phone')}
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('form.phonePlaceholder')}
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-1">
                        {t('form.subject')}
                      </label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={t('form.subjectPlaceholder')}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">
                      {t('form.message')}
                    </label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('form.messagePlaceholder')}
                      rows={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('form.sending')}
                      </>
                    ) : isVerified ? (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {t('form.submit')}
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {t('form.verifyEmail')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('info.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-sm">{t('info.address')}</h4>
                    <p className="text-muted-foreground">
                      Provinciebaan 192A<br />
                      8880 Ledegem,<br />
                      België
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm">{t('info.phone')}</h4>
                    <a href="tel:+32467662197" className="text-muted-foreground hover:text-primary">
                      +32 467662197
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm">{t('info.email')}</h4>
                    <a
                      href="mailto:info@arianabandencentralebv.be"
                      className="text-muted-foreground hover:text-primary"
                    >
                      info@arianabandencentralebv.be
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-sm">{t('info.hours')}</h4>
                    <p className="text-muted-foreground">{t('info.weekdays')}</p>
                    <p className="text-muted-foreground">{t('info.weekends')}</p>
                    <p className="text-muted-foreground">{t('info.closed')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('map.title')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <iframe
                    title="Company Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2517.96964181646!2d3.1257447159719304!3d50.87064607953515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c33f22c097282f%3A0x8c129cb357fb80b7!2sProvinceway%20192%2C%208880%20Ledegem%2C%20Belgium!5e0!3m2!1sen!2sus!4v1625738775224!5m2!1sen!2sus"
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    loading="lazy"
                  ></iframe>
                  <div className="p-3">
                    <a
                      href="https://goo.gl/maps/4CjdhsRWEXymQ3Ry8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {t('map.viewLarger')} →
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('faq.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">{t('faq.questions.response.question')}</h3>
                <p className="text-muted-foreground">{t('faq.questions.response.answer')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">{t('faq.questions.appointment.question')}</h3>
                <p className="text-muted-foreground">{t('faq.questions.appointment.answer')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">{t('faq.questions.warranty.question')}</h3>
                <p className="text-muted-foreground">{t('faq.questions.warranty.answer')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Email Verification Dialog */}
      <AlertDialog open={showVerification} onOpenChange={setShowVerification}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('form.verification.title')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>{t('form.verification.description')}</p>
              <p className="font-medium">{sentEmail}</p>
              
              <div className="my-4">
                <label htmlFor="verification-code" className="block text-sm font-medium mb-1">
                  {t('form.verification.enterCode')}
                </label>
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder={t('form.verification.codePlaceholder')}
                  maxLength={6}
                  className={verificationError ? "border-red-500" : ""}
                />
                {verificationError && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {t('form.verification.error')}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:justify-between">
            <Button variant="link" size="sm" onClick={resendCode} className="sm:order-1 mt-0">
              {t('form.verification.resend')}
            </Button>
            
            <div className="flex gap-2 sm:order-2">
              <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleVerify} disabled={isVerifying || !verificationCode}>
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('form.verification.verifying')}
                  </>
                ) : (
                  t('form.verification.verify')
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
