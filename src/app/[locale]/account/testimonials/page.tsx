import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import UserTestimonialForm from "@/components/user/user-testimonial-form";
import { getTranslations } from "next-intl/server";

export default async function AccountTestimonialsPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("Account.testimonials");
  
  if (!session?.user) {
    redirect("/signin");
  }

  // Get user's existing testimonials
  const testimonials = await prisma.testimonial.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">
          {t("title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <Separator />

      <Tabs defaultValue={testimonials.length > 0 ? t("actions.edit") : t("actions.add")} className="space-y-4">
        <TabsList>
          {testimonials.length > 0 && (
            <TabsTrigger value="existing">{t("actions.edit")}</TabsTrigger>
          )}
          <TabsTrigger value="new">{t("actions.add")}</TabsTrigger>
        </TabsList>

        {testimonials.length > 0 && (
          <TabsContent value="existing" className="space-y-4">
            <div className="grid gap-4">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="p-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex text-yellow-400">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <svg
                          key={index}
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 ${
                            index >= testimonial.rating ? "text-gray-300" : ""
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    <div className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                      {testimonial.status === "PENDING"
                        ? t("status.pending")
                        : testimonial.status === "APPROVED"
                        ? t("status.approved")
                        : testimonial.status === "FEATURED"
                        ? t("status.featured")
                        : t("status.rejected")}
                    </div>
                  </div>

                  {testimonial.customerTitle && (
                    <p className="text-sm text-muted-foreground mb-1">
                      {testimonial.customerTitle}
                    </p>
                  )}

                  <p className="text-sm italic">"{testimonial.content}"</p>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    {t("status.submitted")}: {new Date(testimonial.createdAt).toLocaleDateString()}
                  </div>
                </Card>
              ))}
            </div>

            {testimonials.some((t) => t.status === "PENDING") && (
              <p className="text-sm text-muted-foreground mt-2">
                * {t("status.pendingMessage")}
              </p>
            )}
          </TabsContent>
        )}

        <TabsContent value="new">
          <Card>
            <div className="p-6">
              <UserTestimonialForm />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
