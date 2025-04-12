'use client'

import { ShoppingCart, User, Menu, LogOut, X, Globe } from "lucide-react"
import Link from "next/link"
import { useTranslations, useLocale } from 'next-intl'
import { Button } from "./ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "./ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { SearchComponent } from "./search-component"
import { Badge } from "./ui/badge"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { LocaleSwitcher } from "./locale-switcher"

export function Navbar() {
  const t = useTranslations('navbar')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0) // This would be connected to your actual cart state

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const navLinks = [
    { name: t('navLinks.allTires'), href: `/${locale}/products` },
    { name: t('navLinks.tireFinder'), href: `/${locale}/tire-finder` },
    { name: t('navLinks.brands'), href: `/${locale}/brands` },
    { name: t('navLinks.deals'), href: `/${locale}/deals` },
    { name: t('navLinks.installation'), href: `/${locale}/installation` },
  ]

  // Different menu items based on authentication state and role
  const getMenuItems = () => {
    if (!session) {
      return [
        { name: t('auth.login'), href: `/${locale}/login` },
        { name: t('auth.register'), href: `/${locale}/register` },
        { name: t('auth.becomeRetailer'), href: `/${locale}/become-retailer` },
      ]
    }

    const items = [
      { name: t('userMenu.myOrders'), href: `/${locale}/account/orders` },
      { name: t('userMenu.profileSettings'), href: `/${locale}/account/profile` },
      { name: t('userMenu.appointments'), href: `/${locale}/appointments` },
    ]

    // Add role-specific items
    if (session.user.role === "ADMIN") {
      items.push(
        { name: t('userMenu.dashboard'), href: `/${locale}/dashboard` },
        { name: t('userMenu.manageProducts'), href: `/${locale}/dashboard/products` },
        { name: t('userMenu.manageOrders'), href: `/${locale}/dashboard/orders` },
        { name: t('userMenu.retailerApplications'), href: `/${locale}/dashboard/retailer-applications` }
      )
    } else if (session.user.role === "RETAILER") {
      items.push(
        { name: t('userMenu.dashboard'), href: `/${locale}/dashboard` },
        { name: t('userMenu.myOrders'), href: `/${locale}/account/orders` },
        { name: t('userMenu.myAppointments'), href: `/${locale}/appointments` }
      )
    }

    return items
  }

  const menuItems = getMenuItems()

  // Determine text and background colors based on scroll state and path
  const isHomePage = pathname === `/${locale}` || pathname === '/'
  const textColor = isHomePage && !isScrolled ? "text-white" : "text-foreground"
  const bgColor = isScrolled
    ? "bg-background shadow-md"
    : isHomePage 
      ? "bg-transparent" 
      : "bg-background border-b"

  return (
    <header
      className={`sticky top-0 z-50 w-full ${bgColor} transition-all duration-200`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Top Nav - Logo, Nav Links, and Actions */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center lg:w-1/4">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  aria-label="Menu"
                  className={textColor}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%] sm:w-[350px] p-0">
                <div className="flex flex-col h-full">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="text-left flex items-center justify-between">
                      <Link href={`/${locale}`} onClick={() => setIsMobileOpen(false)}>
                        {t('logo')}
                      </Link>
                      <SheetClose className="rounded-full opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                      </SheetClose>
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="p-4">
                    <div className="mb-4">
                      <SearchComponent placeholder={t('search.placeholder')} />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('navigation')}</h3>
                        <nav className="grid gap-1">
                          {navLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={`flex items-center py-2 px-3 rounded-md transition-colors hover:bg-accent ${
                                pathname === link.href ? "bg-accent font-medium" : ""
                              }`}
                            >
                              {link.name}
                            </Link>
                          ))}
                        </nav>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('account')}</h3>
                        <nav className="grid gap-1">
                          {menuItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-center py-2 px-3 rounded-md transition-colors hover:bg-accent ${
                                pathname === item.href ? "bg-accent font-medium" : ""
                              }`}
                            >
                              {item.name}
                            </Link>
                          ))}
                          
                          {session && (
                            <Button
                              variant="ghost"
                              className="justify-start py-2 px-3 rounded-md text-destructive hover:bg-destructive/10"
                              onClick={() => signOut()}
                            >
                              <LogOut className="mr-2 h-4 w-4" />
                              {t('userMenu.signOut')}
                            </Button>
                          )}
                        </nav>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <LocaleSwitcher />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="rounded-full"
                          >
                            {theme === "dark" ? (
                              <Sun className="h-5 w-5" />
                            ) : (
                              <Moon className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link href={`/${locale}`} className="ml-2 lg:ml-0 flex items-center space-x-2">
              <span className={`text-xl font-bold hidden sm:inline-block ${textColor}`}>
                {t('logo')}
              </span>
              <span className={`text-xl font-bold sm:hidden ${textColor}`}>{t('logoShort')}</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center justify-center lg:w-2/4">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors hover:text-primary ${
                    pathname === link.href
                      ? "text-primary after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-primary"
                      : isHomePage && !isScrolled
                      ? "text-white hover:text-white/80"
                      : "text-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* Search and Action Buttons */}
          <div className="flex items-center gap-3 lg:w-1/4 justify-end">
            {/* Search Component - Different sizing for mobile/desktop */}
            <div className="hidden md:block w-full max-w-[300px] lg:max-w-[220px] xl:max-w-[280px]">
              <SearchComponent placeholder={t('search.placeholder')} />
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`hidden md:flex ${textColor}`}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Language Switcher */}
            <div className="hidden md:block">
              <LocaleSwitcher />
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  aria-label="Account"
                  className={textColor}
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {session ? (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {menuItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href}>{item.name}</Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut()}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('userMenu.signOut')}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel>{t('account')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {menuItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href}>{item.name}</Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={`relative ${textColor}`}
              aria-label={t('cart.aria')}
              onClick={() => router.push(`/${locale}/cart`)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartCount > 99 ? '99+' : cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile Search Bar - Only shown on small screens */}
        <div className="md:hidden pb-3">
          <SearchComponent placeholder={t('search.placeholder')} />
        </div>
      </div>
    </header>
  )
}