(() => {
  const get = PB.id;
  const form = get("feedbackForm");
  const preview = get("feedbackPreview");
  const status = get("feedbackStatus");
  const input = get("feedbackText");
  const type = get("feedbackType");
  const params = PB.params();
  const page = params.get("page");
  const question = (params.get("question") || "").slice(0, 250);

  // যোগাযোগের মাধ্যম data.js-এর SITE থেকে আসে।
  const text = (value) => (typeof value === "string" ? value.trim() : "");
  const email = text(SITE.email);
  const hasEmail = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);
  const whatsapp = text(SITE.whatsapp).replace(/\D/g, "");
  const hasWhatsapp = /^\d{10,15}$/.test(whatsapp);
  const formUrl = text(SITE.feedbackForm);
  const hasForm = URL.canParse(formUrl) && /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/.test(formUrl);

  const whatsappLink = get("feedbackWhatsapp");
  const formLink = get("feedbackGform");
  const emailLink = get("feedbackEmail");

  if ([...type.options].some((option) => option.value === params.get("type"))) type.value = params.get("type");
  if (page) {
    const url = URL.canParse(page, location.href) ? new URL(page, location.href) : null;
    if (url?.origin === location.origin && url.href.length <= 1400) get("feedbackUrl").value = url.href;
  }
  if (question) {
    const context = get("feedbackQuestion");
    context.textContent = "সংশ্লিষ্ট প্রশ্ন — " + question;
    context.hidden = false;
  }

  // বাঁ পাশের তালিকায় সরাসরি যোগাযোগের লিংক
  const channels = [];
  if (hasWhatsapp) channels.push(['<a class="contact-channel channel-whatsapp" href="https://wa.me/' + whatsapp + '" target="_blank" rel="noopener noreferrer">', "WhatsApp-এ সরাসরি লিখুন"]);
  if (hasForm) channels.push(['<a class="contact-channel channel-gform" href="' + PB.escape(formUrl) + '" target="_blank" rel="noopener noreferrer">', "Google Form পূরণ করুন"]);
  if (hasEmail) channels.push(['<a class="contact-channel channel-email" href="mailto:' + PB.escape(email) + '">', PB.escape(email)]);
  if (channels.length) {
    const box = get("contactChannel");
    box.innerHTML = channels.map(([open, label]) => open + label + "</a>").join("");
    box.hidden = false;
  } else {
    get("contactMissing").hidden = false;
  }
  get("feedbackCreate").disabled = false;

  async function copy(message) {
    try {
      await navigator.clipboard.writeText(preview.value);
      status.textContent = message;
      return true;
    } catch {
      preview.focus();
      preview.select();
      status.textContent = "লেখা নির্বাচন করা হয়েছে। কীবোর্ড বা টাচ মেনু থেকে কপি করুন।";
      return false;
    }
  }

  input.addEventListener("input", () => input.setCustomValidity(""));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const description = input.value.trim();
    if (!description) {
      input.setCustomValidity("সমস্যার বিবরণ লিখুন।");
      input.reportValidity();
      return;
    }
    const category = type.selectedOptions[0].textContent;
    const pageUrl = get("feedbackUrl").value.trim();
    const title = "প্রশ্নপাঠ — " + category;
    preview.value = [title, pageUrl && "পেজ: " + pageUrl, question && "প্রশ্ন: " + question, description]
      .filter(Boolean).join("\n\n").toWellFormed();
    get("feedbackDraft").hidden = false;
    whatsappLink.hidden = !hasWhatsapp;
    if (hasWhatsapp) whatsappLink.href = "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(preview.value);
    formLink.hidden = !hasForm;
    if (hasForm) formLink.href = formUrl;
    emailLink.hidden = !hasEmail;
    if (hasEmail) {
      emailLink.href = "mailto:" + email + "?subject=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(preview.value);
    }
    status.textContent = hasWhatsapp || hasForm || hasEmail
      ? "বার্তা তৈরি হয়েছে। নিচের যেকোনো বোতাম চেপে পাঠিয়ে দিন।"
      : "বার্তা তৈরি হয়েছে। কপি করে রাখুন; যোগাযোগের মাধ্যম শিগগিরই যোগ হবে।";
    (hasWhatsapp ? whatsappLink : preview).focus();
  });

  // Google Form খোলার আগে বার্তা কপি হয়ে যায়, ফর্মে শুধু পেস্ট করতে হয়।
  formLink.addEventListener("click", () => {
    copy("বার্তা কপি হয়েছে। Google Form-এর ঘরে পেস্ট করে জমা দিন।");
  });
  whatsappLink.addEventListener("click", () => {
    status.textContent = "WhatsApp খুলছে। বার্তাটি দেখে Send চাপুন।";
  });
  get("feedbackCopy").addEventListener("click", () => copy("বার্তা কপি করা হয়েছে।"));
})();
