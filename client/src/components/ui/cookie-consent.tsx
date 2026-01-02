import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type ConsentPrefs = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift() || null;
  return null;
}

function setCookie(name: string, value: string, days = 365) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${d.toUTCString()}`;
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPrefs>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    try {
      const raw = getCookie("cookie_consent");
      if (!raw) {
        setVisible(true);
        return;
      }
      const parsed: ConsentPrefs = JSON.parse(decodeURIComponent(raw));
      if (parsed && typeof parsed === "object") {
        setPrefs({
          necessary: true,
          analytics: !!parsed.analytics,
          marketing: !!parsed.marketing,
        });
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const encodedPrefs = useMemo(() => encodeURIComponent(JSON.stringify(prefs)), [prefs]);

  const acceptAll = () => {
    const next = { necessary: true, analytics: true, marketing: true } as ConsentPrefs;
    setPrefs(next);
    setCookie("cookie_consent", encodeURIComponent(JSON.stringify(next)));
    setVisible(false);
  };

  const save = () => {
    setCookie("cookie_consent", encodedPrefs);
    setVisible(false);
    setManage(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-lg border bg-white shadow-lg p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h2 className="font-semibold text-base md:text-lg mb-1">We value your privacy</h2>
            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your experience. Necessary cookies are always on. You can manage your
              preferences for analytics and marketing cookies.
              Read our <a className="underline" href="/privacy">Privacy Policy</a> and <a className="underline" href="/terms">Terms of Service</a>.
            </p>
            {manage && (
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Necessary</p>
                    <p className="text-xs text-muted-foreground">Required for basic site functionality</p>
                  </div>
                  <Switch checked disabled aria-readonly className="opacity-60" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Analytics</p>
                    <p className="text-xs text-muted-foreground">Helps us improve the product</p>
                  </div>
                  <Switch
                    checked={prefs.analytics}
                    onCheckedChange={(val) => setPrefs((p) => ({ ...p, analytics: !!val }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Marketing</p>
                    <p className="text-xs text-muted-foreground">Personalized offers and content</p>
                  </div>
                  <Switch
                    checked={prefs.marketing}
                    onCheckedChange={(val) => setPrefs((p) => ({ ...p, marketing: !!val }))}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 min-w-[160px]">
            <Button variant="secondary" onClick={() => setManage((m) => !m)}>
              {manage ? "Close" : "Manage"}
            </Button>
            {manage ? (
              <Button onClick={save}>Save preferences</Button>
            ) : (
              <Button onClick={acceptAll}>Accept all</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


