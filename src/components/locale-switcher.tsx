'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Globe } from 'lucide-react'
import { useSession } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, update: updateSession } = useSession()
  
  const locales = [
    { code: 'en', label: 'English' },
    { code: 'nl', label: 'Nederlands' },
  ]

  const switchLocale = async (newLocale: string) => {
    // Replace the current locale segment in the path with the new locale
    const currentPathWithoutLocale = pathname.replace(`/${locale}`, '')
    const newPath = `/${newLocale}${currentPathWithoutLocale || ''}`

    // If user is logged in, update their preferred language
    if (session?.user) {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preferredLanguage: newLocale,
          }),
        })

        if (response.ok) {
          // Update the session to reflect the new language preference
          await updateSession({
            ...session,
            user: {
              ...session.user,
              preferredLanguage: newLocale,
            },
          })
        }
      } catch (error) {
        console.error('Failed to update language preference:', error)
      }
    }

    router.push(newPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => switchLocale(loc.code)}
            className={locale === loc.code ? 'bg-accent font-medium' : ''}
          >
            {loc.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}