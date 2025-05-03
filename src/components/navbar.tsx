"use client";

import { ShoppingCart, User, Menu, LogOut, X, Clock } from "lucide-react";

import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";

// Use dynamic import with no SSR to avoid hydration issues with date/time
const StoreStatus = dynamic(
  () => import("./store-status").then((mod) => mod.StoreStatus),
  {
    ssr: false,
    loading: () => (
      <div className='flex items-center gap-2'>
        <Clock className='h-4 w-4 animate-pulse' />
        <span className='text-sm'>Loading...</span>
      </div>
    ),
  }
);
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { SearchComponent } from "./search-component";
import { Badge } from "./ui/badge";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { LocaleSwitcher } from "./locale-switcher";
import { useCart } from "@/contexts/cart-context";
import { CartQuickView } from "./cart-quick-view";
import { Link } from "@/i18n/navigation";

export function Navbar() {
  const t = useTranslations("navbar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const isHomePage = pathname === `/${locale}` || pathname === "/";
  useEffect(() => {
    const handleScroll = () => {
      // Set isScrolled to true immediately when on homepage
      // This ensures the navbar is always visible
      if (isHomePage) {
        setIsScrolled(true);
      } else {
        // For other pages, maintain normal scroll behavior
        if (window.scrollY > 10) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      }
    };

    // Set initial scroll state
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: t("navLinks.allTires"), href: `/products` },
    { name: t("navLinks.tireFinder"), href: `/tire-finder` },
    { name: t("navLinks.brands"), href: `/brands` },
    { name: t("navLinks.deals"), href: `/deals` },
    { name: t("navLinks.installation"), href: `/installation` },
  ];

  // Different menu items based on authentication state and role
  const getMenuItems = () => {
    if (!session) {
      return [
        { name: t("auth.login"), href: `/login` },
        { name: t("auth.register"), href: `/register` },
        { name: t("auth.becomeRetailer"), href: `/become-retailer` },
      ];
    }

    const items = [
      { name: t("userMenu.myOrders"), href: `/account/orders` },
      { name: t("userMenu.profileSettings"), href: `/account/settings` },
      { name: t("userMenu.appointments"), href: `/appointments` },
    ];

    // Add role-specific items
    if (session.user.role === "ADMIN") {
      items.push(
        { name: t("userMenu.dashboard"), href: `/dashboard` },
        { name: t("userMenu.manageProducts"), href: `/dashboard/products` },
        { name: t("userMenu.manageOrders"), href: `/dashboard/orders` },
        {
          name: t("userMenu.retailerApplications"),
          href: `/dashboard/retailer-applications`,
        }
      );
    } else if (session.user.role === "RETAILER") {
      items.push(
        { name: t("userMenu.dashboard"), href: `/dashboard` },
        { name: t("userMenu.myOrders"), href: `/account/orders` },
        { name: t("userMenu.myAppointments"), href: `/appointments` }
      );
    }

    return items;
  };

  const menuItems = getMenuItems();

  // Determine text and background colors based on scroll state and path

  const textColor =
    isHomePage && !isScrolled ? "text-white" : "text-foreground";
  const bgColor = isScrolled
    ? "bg-background shadow-md"
    : isHomePage
    ? "bg-background/50 backdrop-blur-md"
    : "bg-background border-b";

  return (
    <header
      className={`sticky top-0 z-50 w-full ${bgColor} transition-all duration-200`}
    >
      <div className=' mx-auto px-4 lg:px-8'>
        {/* Top Nav - Logo, Nav Links, and Actions */}
        <div className='flex h-16 items-center justify-between'>
          {/* Logo and Mobile Menu */}
          <div className='flex items-center lg:w-1/4'>
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild className='lg:hidden'>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label='Menu'
                  className={textColor}
                >
                  <Menu className='h-5 w-5' />
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='w-[80%] sm:w-[350px] p-0'>
                <div className='flex flex-col h-full'>
                  <SheetHeader className='p-4 border-b'>
                    <SheetTitle className='text-left flex items-center justify-between'>
                      <Link href={`/`} onClick={() => setIsMobileOpen(false)}>
                        {t("logo")}
                      </Link>
                      <SheetClose className='rounded-full opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring'>
                        <X className='h-4 w-4' />
                        <span className='sr-only'>Close</span>
                      </SheetClose>
                    </SheetTitle>
                  </SheetHeader>

                  <div className='p-4'>
                    <div className='mb-4'>
                      <SearchComponent placeholder={t("search.placeholder")} />
                    </div>

                    <div className='space-y-4'>
                      <div>
                        <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                          {t("navigation")}
                        </h3>
                        <nav className='grid gap-1'>
                          {navLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={`flex items-center py-2 px-3 rounded-md transition-colors hover:bg-accent ${
                                pathname === link.href
                                  ? "bg-accent font-medium"
                                  : ""
                              }`}
                            >
                              {link.name}
                            </Link>
                          ))}
                        </nav>
                      </div>

                      <div className='border-t pt-4'>
                        <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                          {t("account")}
                        </h3>
                        <nav className='grid gap-1'>
                          {menuItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-center py-2 px-3 rounded-md transition-colors hover:bg-accent ${
                                pathname === item.href
                                  ? "bg-accent font-medium"
                                  : ""
                              }`}
                            >
                              {item.name}
                            </Link>
                          ))}

                          {session && (
                            <Button
                              variant='ghost'
                              className='justify-start py-2 px-3 rounded-md text-destructive hover:bg-destructive/10'
                              onClick={() => signOut()}
                            >
                              <LogOut className='mr-2 h-4 w-4' />
                              {t("userMenu.signOut")}
                            </Button>
                          )}
                        </nav>
                      </div>

                      <div className='border-t pt-4'>
                        <div className='flex items-center justify-between'>
                          <LocaleSwitcher />
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() =>
                              setTheme(theme === "dark" ? "light" : "dark")
                            }
                            className='rounded-full'
                          >
                            {theme === "dark" ? (
                              <Sun className='h-5 w-5' />
                            ) : (
                              <Moon className='h-5 w-5' />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link
              href={`/`}
              className='ml-2 lg:ml-0 flex items-center space-x-2'
            >
              <span
                className={`text-xl font-bold hidden sm:inline-block ${textColor}`}
              >
                {t("logo")}
              </span>
              <span className={`text-xl font-bold sm:hidden ${textColor}`}>
                {t("logoShort")}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className='hidden lg:flex items-center justify-center lg:w-2/4'>
            <div className='flex items-center gap-6'>
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
          <div className='flex items-center gap-3 lg:w-1/4 justify-end'>
            {/* Search Component - Different sizing for mobile/desktop */}
            <div className='hidden md:block w-full max-w-[300px] lg:max-w-[220px] xl:max-w-[280px]'>
              <SearchComponent placeholder={t("search.placeholder")} />
            </div>
            {/* Theme Toggle */}
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`hidden md:flex ${textColor}`}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <Sun className='h-5 w-5' />
              ) : (
                <Moon className='h-5 w-5' />
              )}
            </Button>{" "}
            {/* Store Status Indicator - Visible on all devices */}
            <div className='block'>
              <StoreStatus />
            </div>
            {/* Language Switcher */}
            <div className='hidden md:block'>
              <LocaleSwitcher />
            </div>
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label='Account'
                  className={textColor}
                >
                  <User className='h-5 w-5' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                {session ? (
                  <>
                    <DropdownMenuLabel className='font-normal'>
                      <div className='flex flex-col space-y-1'>
                        <p className='text-sm font-medium leading-none'>
                          {session.user.name}
                        </p>
                        <p className='text-xs leading-none text-muted-foreground'>
                          {session.user.email}
                        </p>
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
                      className='text-destructive focus:text-destructive'
                    >
                      <LogOut className='mr-2 h-4 w-4' />
                      {t("userMenu.signOut")}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel>{t("account")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {menuItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href}>{item.name}</Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>{" "}
            {/* Cart Button with Quick View Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className={`relative ${textColor}`}
                  aria-label={t("cart.aria")}
                >
                  <ShoppingCart className='h-5 w-5' />
                  {itemCount > 0 && (
                    <Badge
                      variant='default'
                      className='absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center'
                      aria-label={t("cart.ariaCount", { count: itemCount })}
                    >
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side='right' className='w-full sm:max-w-lg'>
                {" "}
                <SheetHeader className='space-y-2'>
                  <SheetTitle className='flex items-center'>
                    <ShoppingCart className='mr-2 h-5 w-5' />
                    {useTranslations("cart")("title")} ({itemCount})
                  </SheetTitle>
                </SheetHeader>
                <CartQuickView />
                <div className='mt-auto pt-4 space-y-3'>
                  <SheetClose asChild>
                    <Button
                      variant='default'
                      size='lg'
                      className='w-full'
                      asChild
                    >
                      <Link href='/cart'>
                        {useTranslations("cart")("viewCart")}
                      </Link>
                    </Button>
                  </SheetClose>

                  <SheetClose asChild>
                    <Button
                      variant='secondary'
                      size='lg'
                      className='w-full'
                      onClick={() => router.push(`/${locale}/checkout`)}
                      disabled={itemCount === 0}
                    >
                      {useTranslations("cart")("checkout")}
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar - Only shown on small screens */}
        <div className='md:hidden pb-3'>
          <SearchComponent placeholder={t("search.placeholder")} />
        </div>
      </div>
    </header>
  );
}
