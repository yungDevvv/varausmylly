"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createFile, updateDocument } from "@/lib/appwrite/server"
import { storage } from "@/lib/appwrite/client"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export default function Content({ settings }) {
  const [bannerImage, setBannerImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [settingsState, setSettingsState] = useState(settings || {});
  const router = useRouter();
  const t = useTranslations();

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBannerImage(file)
      
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
    }
  }

  const handleSettingChange = (key, value) => {
    setSettingsState(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveContactInfo = async () => {
    try {
      await updateDocument("main_db", "user_settings", settings.$id, { 
        contact_email: settingsState.contact_email,
        contact_phone: settingsState.contact_phone,
        address: settingsState.address
      });
      
      toast({
        title: t("settingsSuccessTitle"),
        description: t("settingsSuccessMessage"),
        variant: "success",
      })
      router.refresh()
    } catch (error) {
      console.log(error)
      toast({
        title: t("settingsErrorTitle"),
        description: t("settingsErrorMessage"),
        variant: "internalerror",
      })
    }
  }

  const handleSaveBanner = async () => {
    if (!bannerImage || !(bannerImage instanceof File)) {
      toast({
        title: t("settingsErrorTitle"),
        description: t("settingsBannerSelectError"),
        variant: "internalerror",
      })
      return;
    }

    let fileId = null;
    
    try {
      fileId = await createFile("banner_images", bannerImage)
    } catch (error) {
      console.log(error);
      toast({
        title: t("settingsBannerErrorTitle"),
        description: t("settingsBannerErrorMessage"),
        variant: "internalerror",
      })
      return;
    }

    if (!fileId) return;

    try {
      await updateDocument("main_db", "user_settings", settings.$id, { 
        banner_image: fileId 
      })
      toast({
        title: t("settingsBannerSuccessTitle"),
        description: t("settingsBannerSuccessMessage"),
        variant: "success",
      })
      router.refresh()
    } catch (error) {
      console.log(error)
      toast({
        title: t("settingsErrorTitle"),
        description: t("settingsErrorMessage"),
        variant: "internalerror",
      })
    }
  }

  const handleSaveSocialLinks = async () => {
    try {
      await updateDocument("main_db", "user_settings", settings.$id, {
        facebook_url: settingsState.facebook_url,
        instagram_url: settingsState.instagram_url,
        google_review_url: settingsState.google_review_url
      })
      toast({
        title: t("settingsSocialSuccessTitle"),
        description: t("settingsSocialSuccessMessage"),
        variant: "success",
      })
      router.refresh()
    } catch (error) {
      console.log(error)
      toast({
        title: t("settingsErrorTitle"),
        description: t("settingsSocialErrorMessage"),
        variant: "internalerror",
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">{t("settingsPageTitle")}</h1>

      <div className="space-y-6">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>{t("settingsBannerTitle")}</CardTitle>
            <CardDescription>{t("settingsBannerDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-[4/1] relative overflow-hidden rounded-lg border">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt={t("settingsBannerTitle")}
                  className="object-cover w-full h-full"
                />
              )}
              {!imagePreview && settings?.banner_image && (
                <img
                  src={storage.getFilePreview("banner_images", settings.banner_image)}
                  alt={t("settingsBannerTitle")}
                  className="object-cover w-full h-full"
                />
              )}
              {!imagePreview && !settings?.banner_image && (
                <img
                  src="/banner-placeholder.png"
                  alt={t("settingsBannerTitle")}
                  className="object-cover w-full h-full"
                />
              )}
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="max-w-xs"
              />
              <Button 
                variant="outline" 
                onClick={() => {
                  setBannerImage(null)
                  setImagePreview("")
                }}
              >
                {t("settingsBannerResetBtn")}
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto" onClick={handleSaveBanner}>{t("settingsBannerSaveBtn")}</Button>
          </CardFooter>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>{t("settingsContactTitle")}</CardTitle>
            <CardDescription>{t("settingsContactDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{t("settingsContactEmailLabel")}</Label>
                <Input
                  type="email"
                  placeholder={t("settingsContactEmailPlaceholder")}
                  value={settingsState?.contact_email || ""}
                  onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("settingsContactPhoneLabel")}</Label>
                <Input
                  type="tel"
                  placeholder={t("settingsContactPhonePlaceholder")}
                  value={settingsState?.contact_phone || ""}
                  onChange={(e) => handleSettingChange('contact_phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("settingsContactAddressLabel")}</Label>
                <Input
                  placeholder={t("settingsContactAddressPlaceholder")}
                  value={settingsState?.address || ""}
                  onChange={(e) => handleSettingChange('address', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto" onClick={handleSaveContactInfo}>{t("settingsSaveBtn")}</Button>
          </CardFooter>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>{t("settingsSocialTitle")}</CardTitle>
            <CardDescription>{t("settingsSocialDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{t("settingsSocialFacebookLabel")}</Label>
                <Input
                  type="url"
                  placeholder={t("settingsSocialFacebookPlaceholder")}
                  value={settingsState?.facebook_url || ""}
                  onChange={(e) => handleSettingChange('facebook_url', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("settingsSocialInstagramLabel")}</Label>
                <Input
                  type="url"
                  placeholder={t("settingsSocialInstagramPlaceholder")}
                  value={settingsState?.instagram_url || ""}
                  onChange={(e) => handleSettingChange('instagram_url', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("settingsSocialGoogleLabel")}</Label>
                <Input
                  type="url"
                  placeholder={t("settingsSocialGooglePlaceholder")}
                  value={settingsState?.google_review_url || ""}
                  onChange={(e) => handleSettingChange('google_review_url', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto" onClick={handleSaveSocialLinks}>{t("settingsSaveBtn")}</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
