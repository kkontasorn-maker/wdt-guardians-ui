import type { SiteContent } from "@/lib/contentContext";
import type { NamedPlanId, PaymentMethod } from "@/lib/membership";

export const LOCALE_KEY = "wdt-locale";
export type Locale = "en" | "th";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "th";
}

export function intlLocale(locale: Locale) {
  return locale === "th" ? "th-TH" : "en-US";
}

export function formatMoneyForLocale(amount: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateForLocale(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

type Dict = { [key: string]: string | Dict };

export const messages: Record<Locale, Dict> = {
  en: {
    header: {
      program: "Program",
      impact: "Impact",
      faq: "FAQ",
      join: "Join",
      signIn: "Sign in",
      language: "Language",
      openMenu: "Open menu",
      memberPortal: "Member portal",
      editProfile: "Edit profile",
      signOut: "Sign out",
    },
    footer: {
      foundation: "Watchdog Thailand Foundation",
      location: "WDT Guardians · Chiang Mai, Thailand",
      prototype: "Prototype UI — no real payments are processed.",
      manage: "Manage",
    },
    landing: {
      circleKicker: "A circle around the next case",
      circleBody:
        "Neighbours report. Coordinators verify. A field team responds. Evidence is followed up. Guardians keep that chain staffed.",
      impactKicker: "Impact",
      impactHeadline: "What a steady gift actually pays for.",
      verificationTitle: "Verification",
      verificationBody:
        "Someone picks up the report, checks the facts, and decides if a field visit is needed.",
      fieldTitle: "Field response",
      fieldBody: "A team can leave the same day — transport, handling, and a safe place to take the animal.",
      evidenceTitle: "Evidence follow-up",
      evidenceBody:
        "Photos, notes, and statements are kept so the case does not evaporate after the street is quiet.",
      faqKicker: "FAQ",
      faqHeadline: "Questions before you join",
      faqEmpty: "No FAQ items yet.",
      pricingKicker: "Program",
      pricingHeadline: "Choose the Guardian plan that fits.",
      pricingBody:
        "Monthly or annual giving in Thai baht. Annual plans include two months free. Every plan funds operating capacity — not a named case.",
      recommended: "Recommended",
      choosePlan: "Choose this plan",
      selected: "Selected",
      twoMonthsFree: "Two months free versus monthly giving.",
    },
    interval: {
      monthly: "monthly",
      annual: "annual",
      month: "month",
      year: "year",
    },
    plans: {
      wdt199: {
        name: "WDT 199",
        blurb: "Keeps the intake line and case log moving when a report first comes in.",
        perk1: "Helps staff case intake and verification",
        perk2: "Monthly Guardian note from the Chiang Mai desk",
        perk3: "Annual giving statement",
        perk4: "Pause or cancel any time",
      },
      wdt399: {
        name: "WDT 399",
        blurb:
          "The working gift: verification, coordination, and a field response that does not wait on a fundraiser.",
        perk1: "Everything in WDT 199",
        perk2: "Helps fund field response and on-site coordination",
        perk3: "Evidence follow-up support",
        perk4: "Priority invitation to member briefings",
      },
      wdt999: {
        name: "WDT 999",
        blurb: "Underwrites urgent response and the slower work of documenting what happened.",
        perk1: "Everything in WDT 399",
        perk2: "Helps cover urgent field deployments",
        perk3: "Supports evidence packaging and follow-up",
        perk4: "Quarterly briefing with the program desk",
      },
      custom: {
        name: "Custom",
      },
    },
    payment: {
      card: {
        name: "Credit/debit card",
        description:
          "Pay this period with Visa or Mastercard via Omise. Card numbers stay with Omise — never on WDT servers.",
        short: "Card",
      },
      bank: {
        name: "Automatic bank debit",
        description: "A recurring debit from a Thai bank account on your renewal date.",
        short: "Bank debit",
      },
      promptpay: {
        name: "PromptPay",
        description:
          "Pay this period’s amount with a one-time PromptPay QR. Soft Launch does not auto-debit next periods.",
        short: "PromptPay",
      },
    },
    join: {
      kicker: "Join",
      headline: "Become a Guardian.",
      subhead:
        "Support WDT in Thai baht for this membership period. Pause or cancel any time from the member portal.",
      stepPlan: "Choose plan",
      stepPlanShort: "Plan",
      stepDetails: "Guardian details",
      stepDetailsShort: "Details",
      stepPay: "Payment",
      stepPayShort: "Pay",
      chooseHeadline: "Choose your plan",
      chooseBody: "Annual giving includes two months free. Select a plan to continue.",
      selectedBilled: "Selected · billed {interval}",
      perMonth: "/month",
      perYear: "/ year",
      detailsHeadline: "Guardian details",
      detailsBody: "We use this to send your receipt and membership notes.",
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      phone: "Phone",
      acceptTerms: "Accept terms",
      authorizeBilling:
        "I understand Soft Launch charges the amount due today. Later periods are not auto-debited yet (Phase 2).",
      errFirstName: "First name is required.",
      errLastName: "Last name is required.",
      errEmail: "Enter a valid email.",
      errPhone: "Enter a valid phone number.",
      errTerms: "Accept the terms to continue.",
      errBilling: "Confirm you understand Soft Launch period billing to continue.",
      payHeadline: "Payment",
      payBody:
        "Choose how to pay the amount due today. Soft Launch does not set up automatic renewals yet.",
      omisePowered: "Powered by Omise",
      omiseCardNote:
        "Card details are entered in Omise’s secure form. WDT never sees your full card number.",
      summary: "Summary",
      billing: "Billing",
      monthly: "Monthly",
      annual: "Annual",
      dueToday: "Due today",
      back: "Back",
      continue: "Continue",
      confirming: "Confirming…",
      confirm: "Confirm membership",
      promptpayHeadline: "Scan to pay with PromptPay",
      promptpayBody:
        "Open your banking app and scan this QR for {amount}. Prefer to scan from Photos? Download the QR first.",
      promptpayWaiting: "Waiting for PromptPay confirmation",
      promptpayReturn:
        "After you complete the transfer in your bank app, return to this page — we will confirm payment and show your Guardian ID.",
      promptpayHint:
        "Keep this tab open or bookmark it. If confirmation is slow, check your email for join details and use /manage/login with your Guardian ID.",
      promptpayDownload: "Download QR code",
      promptpayDownloading: "Preparing…",
      promptpayDownloadError: "Could not download the QR. Try a screenshot, or scan on this screen.",
      promptpayMissing: "Missing PromptPay session. Start again from Join.",
      promptpayPollError: "Could not check payment status. Retry in a moment.",
    },
    success: {
      loadErrorHeadline: "We could not load your confirmation",
      loadErrorBody:
        "Membership data in this browser looks damaged. Clear it from the member portal and join again.",
      emptyHeadline: "No membership to confirm",
      emptyBody: "This page appears after you confirm a Guardian plan. Join to receive your ID card.",
      become: "Become a Guardian",
      seeBenefits: "See member benefits",
      headline: "You are now a WDT Guardian",
      welcome: "Welcome, {name}. Keep this ID — it is how the Chiang Mai desk knows you.",
      brand: "WDT Guardians",
      guardianId: "Guardian ID",
      supportLevel: "Support level",
      memberSince: "Member since",
      saveId: "Save Guardian ID",
      copied: "Guardian ID copied.",
      savedFile: "Guardian ID saved as a text file.",
      nextKicker: "What happens next",
      nextMail: "Monthly Guardian Impact Brief",
      nextUpdates: "Inside WDT updates",
      nextRoom: "Quarterly Case Room access",
    },
    manage: {
      memberPortal: "Member portal",
      emptyHeadline: "No Guardian in this browser yet.",
      emptyBody:
        "Sign in with your Guardian ID and join email, become a Guardian, or load a sample WDT 399 member to explore the portal.",
      signIn: "Sign in",
      signOut: "Sign out",
      loginHeadline: "Guardian sign in",
      loginBody:
        "Use the Guardian ID from your success card and the same email you used when joining.",
      guardianId: "Guardian ID",
      loginEmail: "Email",
      signingIn: "Signing in…",
      loginFailed: "Sign-in failed. Check ID and email.",
      loginJoinHint: "New here?",
      loadSample: "Load sample member",
      sampleLoaded: "Loaded Niran Srisawat’s sample WDT 399 membership.",
      errorTitle: "The member record would not load",
      errorBody:
        "Local membership data is unreadable. Clear it and start again, or load the sample WDT 399 member so you can still tour the portal.",
      clearDamaged: "Clear damaged data",
      clearedDamaged: "Cleared damaged membership data.",
      hello: "Hello, {name}.",
      canceledTitle: "This membership is canceled",
      canceledBody:
        "Your giving history is still here. Rejoin from the join form, or switch to a plan below to reactivate this mock record.",
      pausedTitle: "Paused since {date}",
      pausedRecently: "recently",
      pausedBody:
        "Field notes from the desk will pause with billing. Resume when you are ready — your member ID stays the same.",
      currentPlan: "Current plan",
      given: "Given with this membership",
      givenImpact: "About {cases} verified reports and {responses} field responses.",
      nextBilling: "Next mock billing",
      notScheduled: "Not scheduled",
      tabImpact: "Impact",
      tabBilling: "Billing",
      tabSettings: "Settings",
      yearInField: "Your year in the field",
      yearCaption:
        "Rough translations of {given} over {months} of membership. Not an official audit figure.",
      monthOne: "1 month",
      monthMany: "{count} months",
      verification: "Verification",
      reports: "{count} reports",
      fieldResponse: "Field response",
      deployments: "{count} deployments",
      evidence: "Evidence follow-up",
      packets: "{count} packets",
      dedication: "Dedication: {text}",
      receipts: "Receipts",
      receiptsBody: "Mock charges stored on this device.",
      recordCharge: "Record a mock charge",
      noReceipts: "No receipts yet. Join or record a mock charge to see giving history.",
      download: "Download",
      downloadToast: "In production this would download a PDF receipt.",
      recordedReceipt: "Recorded a mock {amount} receipt.",
      planAndPayment: "Plan and payment",
      changePlan: "Change plan",
      switchPlan: "Switch Guardian plan",
      switchPlanBody:
        "Amounts are monthly. Annual members keep their interval; the next mock charge uses the new plan.",
      savePlan: "Save plan",
      planSaved: "You’re now on {name}.",
      updateCard: "Update card",
      replaceCard: "Replace mock card",
      replaceCardBody: "Stored only in localStorage. Use any 16 digits.",
      cardNumber: "Card number",
      saveCard: "Save card",
      cardSaved: "Payment method updated.",
      cardInvalid: "Enter a 16-digit mock card number.",
      resume: "Resume membership",
      pause: "Pause membership",
      resumed: "Membership resumed. The next mock charge is on the calendar.",
      pausedToast: "Membership paused. No further mock charges will be scheduled.",
      cancel: "Cancel membership",
      cancelTitle: "Cancel this Guardian membership?",
      cancelBody:
        "The mock record stays in the browser so you can still read receipts. You will not be billed again.",
      keepIt: "Keep it",
      yesCancel: "Yes, cancel",
      canceledToast: "Membership canceled. You can rejoin any time.",
      prototypeTools: "Prototype tools",
      prototypeBody: "These controls exist only so reviewers can reset the demo.",
      clearMembership: "Clear this membership",
      clearedMembership: "Membership cleared from this browser.",
      joinSomeoneElse: "Join as someone else",
      profileTitle: "Contact details",
      profileBody: "Name, email, and phone used for receipts and desk notes.",
      saveProfile: "Save contact",
      savingProfile: "Saving…",
      profileSaved: "Contact details saved.",
      profileSaveFailed: "Could not save profile. Try again.",
      socialTitle: "Social and messaging",
      socialBody: "Optional handles so the Chiang Mai desk can reach you outside email.",
      socialFacebook: "Facebook",
      socialFacebookHint: "Profile URL or name",
      socialInstagram: "Instagram",
      socialInstagramHint: "@handle",
      socialLine: "LINE ID",
      socialLineHint: "LINE ID",
      socialWhatsapp: "WhatsApp",
      socialWhatsappHint: "Phone with country code",
      saveSocial: "Save social links",
      savingSocial: "Saving…",
      socialSaved: "Social links saved.",
      photoTitle: "Profile photo",
      photoBody: "Shown on your account menu and Guardian badge. Stored in this Soft Launch profile.",
      photoChoose: "Choose photo",
      photoRemove: "Remove photo",
      photoSaving: "Saving photo…",
      photoSaved: "Profile photo saved.",
      photoInvalid: "Choose a JPEG, PNG, or WebP image.",
      photoTooLarge: "That photo is still too large after compression. Try a smaller image.",
      badgeTitle: "Guardian badge",
      badgeBody: "Your membership ID card — download a PNG to keep or share.",
      downloadBadge: "Download badge",
      badgeDownloading: "Preparing…",
      badgeDownloaded: "Guardian badge downloaded.",
      badgeDownloadFailed: "Could not download the badge. Try again.",
    },
    status: {
      active: "Active",
      paused: "Paused",
      canceled: "Canceled",
    },
    notFound: {
      headline: "That trail is not on our map.",
      body: "The page you wanted is missing. Head back to the Guardians program or the member portal.",
      home: "Guardians home",
      portal: "Member portal",
    },
  },
  th: {
    header: {
      program: "โครงการ",
      impact: "ผลงาน",
      faq: "คำถามที่พบบ่อย",
      join: "สมัคร",
      signIn: "เข้าสู่ระบบ",
      language: "ภาษา",
      openMenu: "เปิดเมนู",
      memberPortal: "หน้าสมาชิก",
      editProfile: "แก้ไขโปรไฟล์",
      signOut: "ออกจากระบบ",
    },
    footer: {
      foundation: "มูลนิธิวอทช์ด็อก ประเทศไทย",
      location: "WDT Guardians · เชียงใหม่ ประเทศไทย",
      prototype: "ต้นแบบหน้าจอ — ยังไม่มีการชำระเงินจริง",
      manage: "จัดการสมาชิก",
    },
    landing: {
      circleKicker: "วงที่โอบเคสถัดไป",
      circleBody:
        "เพื่อนบ้านแจ้ง ประสานงานตรวจ ทีมลงพื้นที่ หลักฐานถูกติดตาม กาเดียนช่วยให้สายงานนี้มีคนทำต่อ",
      impactKicker: "ผลงาน",
      impactHeadline: "ของขวัญที่ให้ต่อเนื่อง จ่ายงานอะไรจริงๆ",
      verificationTitle: "ตรวจสอบ",
      verificationBody: "มีคนรับเรื่อง เช็คข้อเท็จจริง แล้วตัดสินว่าต้องลงพื้นที่หรือยัง",
      fieldTitle: "ลงพื้นที่",
      fieldBody: "ทีมออกได้วันเดียวกัน — รถ วิธีจับ และที่ปลอดภัยพาสัตว์ไป",
      evidenceTitle: "ติดตามหลักฐาน",
      evidenceBody: "รูป บันทึก และคำให้การถูกเก็บไว้ เคสจะไม่หายไปตอนถนนสงบ",
      faqKicker: "คำถามที่พบบ่อย",
      faqHeadline: "ถามก่อนสมัคร",
      faqEmpty: "ยังไม่มีคำถาม",
      pricingKicker: "โครงการ",
      pricingHeadline: "เลือกแผนกาเดียนที่เหมาะกับคุณ",
      pricingBody:
        "ให้รายเดือนหรือรายปี เป็นบาท แผนรายปีได้ฟรีสองเดือน ทุกแผนเติมกำลังทำงาน — ไม่ใช่เคสตัวใดตัวหนึ่ง",
      recommended: "แนะนำ",
      choosePlan: "เลือกแผนนี้",
      selected: "เลือกแล้ว",
      twoMonthsFree: "เทียบรายเดือนแล้วได้ฟรีสองเดือน",
    },
    interval: {
      monthly: "รายเดือน",
      annual: "รายปี",
      month: "เดือน",
      year: "ปี",
    },
    plans: {
      wdt199: {
        name: "WDT 199",
        blurb: "ให้สายรับเรื่องกับสมุดเคสเดินต่อ เมื่อมีคนแจ้งเข้ามาครั้งแรก",
        perk1: "ช่วยงานรับเรื่องเคสและตรวจสอบ",
        perk2: "จดหมายจากโต๊ะงานเชียงใหม่ทุกเดือน",
        perk3: "หนังสือรับรองการให้ประจำปี",
        perk4: "หยุดหรือยกเลิกได้ทุกเมื่อ",
      },
      wdt399: {
        name: "WDT 399",
        blurb: "ของขวัญหลัก — ตรวจสอบ ประสานงาน และลงพื้นที่โดยไม่ต้องรอระดมทุน",
        perk1: "ทุกอย่างใน WDT 199",
        perk2: "ช่วยงานลงพื้นที่และประสานหน้างาน",
        perk3: "งานติดตามหลักฐาน",
        perk4: "ได้รับเชิญร่วมสรุปสมาชิกก่อน",
      },
      wdt999: {
        name: "WDT 999",
        blurb: "รับงานเร่งด่วน และงานช้าอย่างการบันทึกว่าเกิดอะไรขึ้น",
        perk1: "ทุกอย่างใน WDT 399",
        perk2: "ช่วยค่าลงพื้นที่เร่งด่วน",
        perk3: "ช่วยจัดชุดหลักฐานและติดตามต่อ",
        perk4: "สรุปกับโต๊ะโครงการรายไตรมาส",
      },
      custom: {
        name: "กำหนดเอง",
      },
    },
    payment: {
      card: {
        name: "บัตรเครดิต/เดบิต",
        description:
          "จ่ายรอบนี้ด้วยวีซ่าหรือมาสเตอร์การ์ดผ่าน Omise เลขบัตรอยู่กับ Omise — ไม่ผ่านเซิร์ฟเวอร์ WDT",
        short: "บัตร",
      },
      bank: {
        name: "ตัดบัญชีอัตโนมัติ",
        description: "ตัดจากบัญชีธนาคารไทยตามวันต่ออายุ",
        short: "ตัดบัญชี",
      },
      promptpay: {
        name: "พร้อมเพย์",
        description:
          "จ่ายยอดรอบนี้ด้วย QR พร้อมเพย์ครั้งเดียว Soft Launch ยังไม่ตัดรอบถัดไปอัตโนมัติ",
        short: "พร้อมเพย์",
      },
    },
    join: {
      kicker: "สมัคร",
      headline: "เป็นกาเดียน",
      subhead:
        "สนับสนุน WDT ด้วยเงินบาทสำหรับรอบสมาชิกนี้ หยุดหรือยกเลิกได้จากหน้าสมาชิก",
      stepPlan: "เลือกแผน",
      stepPlanShort: "แผน",
      stepDetails: "ข้อมูลกาเดียน",
      stepDetailsShort: "ข้อมูล",
      stepPay: "ชำระเงิน",
      stepPayShort: "จ่าย",
      chooseHeadline: "เลือกแผนของคุณ",
      chooseBody: "การให้รายปีได้ฟรีสองเดือน เลือกแผนแล้วไปต่อได้",
      selectedBilled: "เลือกแล้ว · เรียกเก็บ{interval}",
      perMonth: "/เดือน",
      perYear: "/ ปี",
      detailsHeadline: "ข้อมูลกาเดียน",
      detailsBody: "ใช้ส่งใบเสร็จและจดหมายสมาชิก",
      firstName: "ชื่อ",
      lastName: "นามสกุล",
      email: "อีเมล",
      phone: "โทรศัพท์",
      acceptTerms: "ยอมรับเงื่อนไข",
      authorizeBilling:
        "เข้าใจว่า Soft Launch เรียกเก็บยอดที่ต้องจ่ายวันนี้ รอบถัดไปยังไม่ตัดอัตโนมัติ (เฟส 2)",
      errFirstName: "กรอกชื่อ",
      errLastName: "กรอกนามสกุล",
      errEmail: "กรอกอีเมลให้ถูกต้อง",
      errPhone: "กรอกเบอร์โทรให้ถูกต้อง",
      errTerms: "ยอมรับเงื่อนไขก่อนไปต่อ",
      errBilling: "ยืนยันว่าเข้าใจการเรียกเก็บรอบ Soft Launch ก่อนไปต่อ",
      payHeadline: "ชำระเงิน",
      payBody:
        "เลือกวิธีจ่ายยอดที่ต้องจ่ายวันนี้ Soft Launch ยังไม่ตั้งการต่ออายุอัตโนมัติ",
      omisePowered: "ให้บริการชำระเงินโดย Omise",
      omiseCardNote:
        "กรอกข้อมูลบัตรในแบบฟอร์มปลอดภัยของ Omise WDT จะไม่เห็นเลขบัตรเต็ม",
      summary: "สรุป",
      billing: "รอบเรียกเก็บ",
      monthly: "รายเดือน",
      annual: "รายปี",
      dueToday: "ยอดวันนี้",
      back: "กลับ",
      continue: "ต่อไป",
      confirming: "กำลังยืนยัน…",
      confirm: "ยืนยันสมาชิกภาพ",
      promptpayHeadline: "สแกนจ่ายด้วยพร้อมเพย์",
      promptpayBody:
        "เปิดแอปธนาคารแล้วสแกน QR นี้เป็นจำนวน {amount} หากต้องการสแกนจากรูปภาพ ให้ดาวน์โหลด QR ก่อน",
      promptpayWaiting: "รอการยืนยันจากพร้อมเพย์",
      promptpayReturn:
        "โอนในแอปธนาคารเสร็จแล้ว ให้กลับมาที่หน้านี้ — ระบบจะยืนยันการชำระแล้วแสดงรหัสกาเดียน",
      promptpayHint:
        "เปิดแท็บนี้ไว้หรือบุ๊กมาร์กไว้ หากยืนยันช้า ให้เช็คอีเมลและเข้า /manage/login ด้วยรหัสกาเดียน",
      promptpayDownload: "ดาวน์โหลด QR",
      promptpayDownloading: "กำลังเตรียม…",
      promptpayDownloadError: "ดาวน์โหลด QR ไม่ได้ ลองแคปหน้าจอ หรือสแกนบนหน้าจอนี้",
      promptpayMissing: "ไม่พบเซสชันพร้อมเพย์ กรุณาสมัครใหม่จากหน้า Join",
      promptpayPollError: "ตรวจสถานะการชำระไม่ได้ ลองใหม่ในอีกสักครู่",
    },
    success: {
      loadErrorHeadline: "โหลดหน้ายืนยันไม่ได้",
      loadErrorBody: "ข้อมูลสมาชิกในเบราว์เซอร์นี้ดูเสีย ล้างจากหน้าสมาชิกแล้วสมัครใหม่",
      emptyHeadline: "ยังไม่มีสมาชิกภาพให้ยืนยัน",
      emptyBody: "หน้านี้ขึ้นหลังยืนยันแผนกาเดียน สมัครเพื่อรับบัตรรหัส",
      become: "เป็นกาเดียน",
      seeBenefits: "ดูสิทธิ์สมาชิก",
      headline: "คุณเป็นกาเดียน WDT แล้ว",
      welcome: "ยินดีต้อนรับคุณ {name} เก็บรหัสนี้ไว้ — โต๊ะงานเชียงใหม่รู้จักคุณจากอันนี้",
      brand: "WDT Guardians",
      guardianId: "รหัสกาเดียน",
      supportLevel: "ระดับการสนับสนุน",
      memberSince: "สมาชิกตั้งแต่",
      saveId: "บันทึกรหัสกาเดียน",
      copied: "คัดลอกรหัสกาเดียนแล้ว",
      savedFile: "บันทึกรหัสกาเดียนเป็นไฟล์ข้อความแล้ว",
      nextKicker: "ต่อไปจะเกิดอะไร",
      nextMail: "สรุปผลงานกาเดียนรายเดือน",
      nextUpdates: "ข่าวจากใน WDT",
      nextRoom: "เข้าห้องเคสรายไตรมาส",
    },
    manage: {
      memberPortal: "หน้าสมาชิก",
      emptyHeadline: "ยังไม่มีกาเดียนในเบราว์เซอร์นี้",
      emptyBody:
        "เข้าสู่ระบบด้วยรหัสกาเดียนและอีเมลตอนสมัคร สมัครเป็นกาเดียน หรือโหลดตัวอย่าง WDT 399 เพื่อดูหน้าสมาชิก",
      signIn: "เข้าสู่ระบบ",
      signOut: "ออกจากระบบ",
      loginHeadline: "เข้าสู่ระบบกาเดียน",
      loginBody: "ใช้รหัสกาเดียนจากบัตรสำเร็จและอีเมลเดียวกับตอนสมัคร",
      guardianId: "รหัสกาเดียน",
      loginEmail: "อีเมล",
      signingIn: "กำลังเข้าสู่ระบบ…",
      loginFailed: "เข้าสู่ระบบไม่สำเร็จ ตรวจรหัสและอีเมล",
      loginJoinHint: "ยังไม่เป็นสมาชิก?",
      loadSample: "โหลดสมาชิกตัวอย่าง",
      sampleLoaded: "โหลดสมาชิกตัวอย่าง WDT 399 ของนิรันดร์ ศรีสวัสดิ์แล้ว",
      errorTitle: "โหลดข้อมูลสมาชิกไม่ได้",
      errorBody:
        "ข้อมูลสมาชิกในเครื่องอ่านไม่ได้ ล้างแล้วเริ่มใหม่ หรือโหลดตัวอย่าง WDT 399 เพื่อดูหน้าสมาชิกต่อ",
      clearDamaged: "ล้างข้อมูลที่เสีย",
      clearedDamaged: "ล้างข้อมูลสมาชิกที่เสียแล้ว",
      hello: "สวัสดี คุณ{name}",
      canceledTitle: "สมาชิกภาพนี้ถูกยกเลิกแล้ว",
      canceledBody:
        "ประวัติการให้ยังอยู่ สมัครใหม่จากฟอร์ม หรือเปลี่ยนแผนด้านล่างเพื่อเปิดเรคคอร์ดจำลองนี้ใหม่",
      pausedTitle: "หยุดไว้ตั้งแต่ {date}",
      pausedRecently: "ไม่นานมานี้",
      pausedBody: "จดหมายจากโต๊ะงานจะหยุดพร้อมการเรียกเก็บ พร้อมเมื่อไหร่ค่อยต่อ — รหัสสมาชิกยังเป็นอันเดิม",
      currentPlan: "แผนปัจจุบัน",
      given: "ให้ไปแล้วในสมาชิกภาพนี้",
      givenImpact: "ราว {cases} รายงานที่ตรวจแล้ว และ {responses} ครั้งที่ลงพื้นที่",
      nextBilling: "รอบเรียกเก็บจำลองถัดไป",
      notScheduled: "ยังไม่นัด",
      tabImpact: "ผลงาน",
      tabBilling: "การเงิน",
      tabSettings: "ตั้งค่า",
      yearInField: "ปีของคุณในภาคสนาม",
      yearCaption: "แปลงคร่าวๆ จาก {given} ตลอด {months} ของการเป็นสมาชิก ไม่ใช่ตัวเลขตรวจสอบบัญชี",
      monthOne: "1 เดือน",
      monthMany: "{count} เดือน",
      verification: "ตรวจสอบ",
      reports: "{count} รายงาน",
      fieldResponse: "ลงพื้นที่",
      deployments: "{count} ครั้ง",
      evidence: "ติดตามหลักฐาน",
      packets: "{count} ชุด",
      dedication: "อุทิศให้: {text}",
      receipts: "ใบเสร็จ",
      receiptsBody: "รายการจำลองที่เก็บในเครื่องนี้",
      recordCharge: "บันทึกการเรียกเก็บจำลอง",
      noReceipts: "ยังไม่มีใบเสร็จ สมัครหรือบันทึกการเรียกเก็บจำลองเพื่อดูประวัติ",
      download: "ดาวน์โหลด",
      downloadToast: "ระบบจริงจะดาวน์โหลดใบเสร็จ PDF",
      recordedReceipt: "บันทึกใบเสร็จจำลอง {amount} แล้ว",
      planAndPayment: "แผนและการชำระเงิน",
      changePlan: "เปลี่ยนแผน",
      switchPlan: "สลับแผนกาเดียน",
      switchPlanBody: "ยอดเป็นรายเดือน สมาชิกรายปีคงรอบเดิม การเรียกเก็บจำลองครั้งถัดไปใช้แผนใหม่",
      savePlan: "บันทึกแผน",
      planSaved: "คุณอยู่แผน {name} แล้ว",
      updateCard: "อัปเดตบัตร",
      replaceCard: "เปลี่ยนบัตรจำลอง",
      replaceCardBody: "เก็บเฉพาะใน localStorage ใช้ตัวเลข 16 หลักอะไรก็ได้",
      cardNumber: "หมายเลขบัตร",
      saveCard: "บันทึกบัตร",
      cardSaved: "อัปเดตวิธีชำระเงินแล้ว",
      cardInvalid: "กรอกเลขบัตรจำลอง 16 หลัก",
      resume: "ต่อสมาชิกภาพ",
      pause: "หยุดสมาชิกภาพชั่วคราว",
      resumed: "ต่อสมาชิกภาพแล้ว รอบเรียกเก็บจำลองถัดไปอยู่ในปฏิทิน",
      pausedToast: "หยุดสมาชิกภาพแล้ว จะไม่นัดเรียกเก็บจำลองเพิ่ม",
      cancel: "ยกเลิกสมาชิกภาพ",
      cancelTitle: "ยกเลิกสมาชิกภาพกาเดียนนี้?",
      cancelBody: "เรคคอร์ดจำลองยังอยู่ในเบราว์เซอร์ อ่านใบเสร็จได้ จะไม่ถูกเรียกเก็บอีก",
      keepIt: "เก็บไว้",
      yesCancel: "ใช่ ยกเลิก",
      canceledToast: "ยกเลิกสมาชิกภาพแล้ว สมัครใหม่ได้ทุกเมื่อ",
      prototypeTools: "เครื่องมือต้นแบบ",
      prototypeBody: "ปุ่มเหล่านี้มีไว้ให้ผู้ตรวจรีเซ็ตเดโมเท่านั้น",
      clearMembership: "ล้างสมาชิกภาพนี้",
      clearedMembership: "ล้างสมาชิกภาพจากเบราว์เซอร์นี้แล้ว",
      joinSomeoneElse: "สมัครเป็นคนอื่น",
      profileTitle: "ข้อมูลติดต่อ",
      profileBody: "ชื่อ อีเมล และเบอร์โทร สำหรับใบเสร็จและจดหมายจากโต๊ะงาน",
      saveProfile: "บันทึกข้อมูลติดต่อ",
      savingProfile: "กำลังบันทึก…",
      profileSaved: "บันทึกข้อมูลติดต่อแล้ว",
      profileSaveFailed: "บันทึกโปรไฟล์ไม่สำเร็จ ลองอีกครั้ง",
      socialTitle: "โซเชียลและการแชท",
      socialBody: "ไม่บังคับ — ให้โต๊ะงานเชียงใหม่ติดต่อนอกอีเมลได้",
      socialFacebook: "Facebook",
      socialFacebookHint: "ลิงก์โปรไฟล์หรือชื่อ",
      socialInstagram: "Instagram",
      socialInstagramHint: "@แฮนเดิล",
      socialLine: "LINE ID",
      socialLineHint: "LINE ID",
      socialWhatsapp: "WhatsApp",
      socialWhatsappHint: "เบอร์พร้อมรหัสประเทศ",
      saveSocial: "บันทึกลิงก์โซเชียล",
      savingSocial: "กำลังบันทึก…",
      socialSaved: "บันทึกลิงก์โซเชียลแล้ว",
      photoTitle: "รูปโปรไฟล์",
      photoBody: "แสดงที่เมนูบัญชีและบัตรกาเดียน เก็บในโปรไฟล์ Soft Launch นี้",
      photoChoose: "เลือกรูป",
      photoRemove: "ลบรูป",
      photoSaving: "กำลังบันทึกรูป…",
      photoSaved: "บันทึกรูปโปรไฟล์แล้ว",
      photoInvalid: "เลือกรูป JPEG, PNG หรือ WebP",
      photoTooLarge: "รูปยังใหญ่เกินไปหลังบีบอัด ลองใช้รูปที่เล็กลง",
      badgeTitle: "บัตรกาเดียน",
      badgeBody: "บัตรสมาชิกของคุณ — ดาวน์โหลดเป็น PNG เก็บหรือแชร์ได้",
      downloadBadge: "ดาวน์โหลดบัตร",
      badgeDownloading: "กำลังเตรียม…",
      badgeDownloaded: "ดาวน์โหลดบัตรกาเดียนแล้ว",
      badgeDownloadFailed: "ดาวน์โหลดบัตรไม่สำเร็จ ลองอีกครั้ง",
    },
    status: {
      active: "ใช้งาน",
      paused: "หยุดชั่วคราว",
      canceled: "ยกเลิกแล้ว",
    },
    notFound: {
      headline: "เส้นทางนี้ไม่อยู่บนแผนที่ของเรา",
      body: "หน้าที่ต้องการไม่มี กลับไปที่โครงการกาเดียน หรือหน้าสมาชิก",
      home: "หน้าแรกกาเดียน",
      portal: "หน้าสมาชิก",
    },
  },
};

export const THAI_SITE_CONTENT: SiteContent = {
  hero: {
    headline: "คุณไม่ต้องไปทุกเคส — แต่ช่วยให้ WDT ไปถึงเคสถัดไปได้",
    subhead:
      "การสนับสนุนรายงวดของกาเดียน ทำให้มูลนิธิวอทช์ด็อก ประเทศไทย พร้อมตรวจสอบ ประสานงาน ลงพื้นที่ และติดตามหลักฐาน — งานที่ไม่หวือหวา แต่ชี้ว่าเคสสัตว์จรจัดที่เชียงใหม่เดินต่อหรือสะดุด",
    primaryButtonText: "เป็นกาเดียน",
    secondaryButtonText: "วิธีทำงาน",
  },
  trustCards: [
    {
      title: "มูลนิธิจดทะเบียน",
      description: "มูลนิธิวอทช์ด็อก ประเทศไทย เป็นมูลนิธิที่จดทะเบียน ทำงานสวัสดิภาพสัตว์จากเชียงใหม่",
    },
    {
      title: "ชำระเงินปลอดภัย",
      description: "สมาชิกภาพเป็นการให้เป็นงวด ต้นแบบนี้ไม่มีการตัดเงินจริง",
    },
    {
      title: "ต่ออายุโปร่งใส",
      description: "เห็นวันต่ออายุ หยุดได้เมื่อต้องการ และยกเลิกได้โดยไม่ต้องโทรไล่ถาม",
    },
    {
      title: "ไม่ชี้นำเคส",
      description: "ของขวัญจากกาเดียนเติมกำลังทำงาน ไม่ได้ซื้อสิทธิ์ว่า WDT จะรับเคสไหนต่อไป",
    },
  ],
  pricing: [
    { name: "WDT 199", monthlyPrice: 199, annualPrice: 1990, recommended: false },
    { name: "WDT 399", monthlyPrice: 399, annualPrice: 3990, recommended: true },
    { name: "WDT 999", monthlyPrice: 999, annualPrice: 9990, recommended: false },
  ],
  faq: [
    {
      question: "บอก WDT ได้ไหมว่าจะรับเคสไหน",
      answer:
        "ไม่ได้ ของขวัญจากกาเดียนเลี้ยงโต๊ะงานกับทีมภาคสนาม ไม่ใช่สัตว์ตัวหนึ่ง นี่ตั้งใจไว้: สมาชิกภาพต้องไม่พาเคสไปทางไหน",
    },
    {
      question: "หยุดหรือยกเลิกได้ไหม",
      answer:
        "ได้ จากหน้าสมาชิก การหยุดยังคงรหัสกาเดียน การยกเลิกแค่ไม่ต่ออายุจำลอง ไม่มีการตัดเงินจริงที่นี่",
    },
    {
      question: "เงินไปที่ไหน",
      answer:
        "เงินที่ให้ต่อเนื่องไปงานตรวจสอบ ประสานงาน ลงพื้นที่ และติดตามหลักฐาน ของมูลนิธิวอทช์ด็อก ประเทศไทย เรื่องสัตว์จรจัดที่เชียงใหม่",
    },
  ],
};

function lookup(dict: Dict, key: string): string | undefined {
  const parts = key.split(".");
  let node: string | Dict | undefined = dict;
  for (const part of parts) {
    if (!node || typeof node === "string") return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] === undefined ? `{${name}}` : String(vars[name])
  );
}

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>) {
  const raw = lookup(messages[locale], key) ?? lookup(messages.en, key) ?? key;
  return interpolate(raw, vars);
}

export function planCopy(id: NamedPlanId, locale: Locale) {
  return {
    name: translate(locale, `plans.${id}.name`),
    blurb: translate(locale, `plans.${id}.blurb`),
    perks: [
      translate(locale, `plans.${id}.perk1`),
      translate(locale, `plans.${id}.perk2`),
      translate(locale, `plans.${id}.perk3`),
      translate(locale, `plans.${id}.perk4`),
    ],
  };
}

export function paymentCopy(id: PaymentMethod, locale: Locale) {
  return {
    name: translate(locale, `payment.${id}.name`),
    description: translate(locale, `payment.${id}.description`),
    short: translate(locale, `payment.${id}.short`),
  };
}

export function paymentBrandLabel(brand: string, locale: Locale) {
  if (brand === "Bank debit") return translate(locale, "payment.bank.short");
  if (brand === "PromptPay") return translate(locale, "payment.promptpay.short");
  if (brand === "Card") return translate(locale, "payment.card.short");
  return brand;
}
