"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/localeContext";
import type { Membership } from "@/lib/membership";

type Props = {
  membership: Membership;
  fromSession: boolean;
  onSaved: (next: Membership) => void;
};

export function MemberProfileForms({ membership, fromSession, onSaved }: Props) {
  const { t } = useLocale();
  const [firstName, setFirstName] = useState(membership.firstName);
  const [lastName, setLastName] = useState(membership.lastName);
  const [email, setEmail] = useState(membership.email);
  const [phone, setPhone] = useState(membership.phone);
  const [facebook, setFacebook] = useState(membership.facebook ?? "");
  const [instagram, setInstagram] = useState(membership.instagram ?? "");
  const [lineId, setLineId] = useState(membership.lineId ?? "");
  const [whatsapp, setWhatsapp] = useState(membership.whatsapp ?? "");
  const [savingContact, setSavingContact] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);

  useEffect(() => {
    setFirstName(membership.firstName);
    setLastName(membership.lastName);
    setEmail(membership.email);
    setPhone(membership.phone);
    setFacebook(membership.facebook ?? "");
    setInstagram(membership.instagram ?? "");
    setLineId(membership.lineId ?? "");
    setWhatsapp(membership.whatsapp ?? "");
  }, [membership]);

  async function persist(partial: Partial<Membership>, mode: "contact" | "social") {
    const setBusy = mode === "contact" ? setSavingContact : setSavingSocial;
    setBusy(true);
    const next: Membership = { ...membership, ...partial };

    try {
      if (fromSession) {
        const res = await fetch("/api/member/profile", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: next.firstName,
            lastName: next.lastName,
            email: next.email,
            phone: next.phone,
            facebook: next.facebook ?? "",
            instagram: next.instagram ?? "",
            lineId: next.lineId ?? "",
            whatsapp: next.whatsapp ?? "",
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? "save failed");
        }
        const data = (await res.json()) as { membership?: Membership };
        onSaved(data.membership ? { ...next, ...data.membership } : next);
      } else {
        onSaved(next);
      }
      toast.success(
        mode === "contact" ? t("manage.profileSaved") : t("manage.socialSaved")
      );
    } catch {
      toast.error(t("manage.profileSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  function onContactSubmit(e: FormEvent) {
    e.preventDefault();
    const f = firstName.trim();
    const l = lastName.trim();
    const mail = email.trim().toLowerCase();
    if (!f) {
      toast.error(t("join.errFirstName"));
      return;
    }
    if (!l) {
      toast.error(t("join.errLastName"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      toast.error(t("join.errEmail"));
      return;
    }
    void persist(
      { firstName: f, lastName: l, email: mail, phone: phone.trim() },
      "contact"
    );
  }

  function onSocialSubmit(e: FormEvent) {
    e.preventDefault();
    void persist(
      {
        facebook: facebook.trim(),
        instagram: instagram.trim(),
        lineId: lineId.trim(),
        whatsapp: whatsapp.trim(),
      },
      "social"
    );
  }

  return (
    <>
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="font-heading text-xl">{t("manage.profileTitle")}</CardTitle>
          <CardDescription>{t("manage.profileBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onContactSubmit}>
            <div>
              <Label htmlFor="profile-first">{t("join.firstName")}</Label>
              <Input
                id="profile-first"
                className="mt-2"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div>
              <Label htmlFor="profile-last">{t("join.lastName")}</Label>
              <Input
                id="profile-last"
                className="mt-2"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
            <div>
              <Label htmlFor="profile-email">{t("join.email")}</Label>
              <Input
                id="profile-email"
                type="email"
                className="mt-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="profile-phone">{t("join.phone")}</Label>
              <Input
                id="profile-phone"
                type="tel"
                className="mt-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={savingContact}>
                {savingContact ? t("manage.savingProfile") : t("manage.saveProfile")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="font-heading text-xl">{t("manage.socialTitle")}</CardTitle>
          <CardDescription>{t("manage.socialBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSocialSubmit}>
            <div>
              <Label htmlFor="profile-facebook">{t("manage.socialFacebook")}</Label>
              <Input
                id="profile-facebook"
                className="mt-2"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder={t("manage.socialFacebookHint")}
                autoComplete="username"
              />
            </div>
            <div>
              <Label htmlFor="profile-instagram">{t("manage.socialInstagram")}</Label>
              <Input
                id="profile-instagram"
                className="mt-2"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder={t("manage.socialInstagramHint")}
                autoComplete="username"
              />
            </div>
            <div>
              <Label htmlFor="profile-line">{t("manage.socialLine")}</Label>
              <Input
                id="profile-line"
                className="mt-2"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder={t("manage.socialLineHint")}
              />
            </div>
            <div>
              <Label htmlFor="profile-whatsapp">{t("manage.socialWhatsapp")}</Label>
              <Input
                id="profile-whatsapp"
                className="mt-2"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={t("manage.socialWhatsappHint")}
                autoComplete="tel"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="outline" disabled={savingSocial}>
                {savingSocial ? t("manage.savingSocial") : t("manage.saveSocial")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
