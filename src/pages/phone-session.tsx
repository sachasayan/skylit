import { Disclosure, DisclosureTitle } from "../components/ui/disclosure";
import { useLayoutEffect, useRef } from "react";
import { Button } from "../components/ui/button";
function Invitation({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const host = ref.current!,
      canvas = window.SkylitPhonePairing.canvas(value, document);
    host.append(canvas);
    return () => canvas.remove();
  }, [value]);
  return <span ref={ref} />;
}
export function PhoneSession({
  phone,
  onDecide,
}: {
  phone:
    | { active: false }
    | {
        active: true;
        request: string;
        number: string;
        paired: boolean;
        invite: string;
        address: string;
        expires: number;
        fingerprint: string;
      };
  onDecide: (request: string, allow: boolean) => void;
}) {
  if (!phone?.active)
    return (
      <p className="small subtle">
        Phone pairing is paused or waiting for Wi-Fi.
      </p>
    );
  return (
    <>
      {phone.request && /^\d{6}$/.test(phone.number) ? (
        <div
          className="phone-pair-confirm"
          role="group"
          aria-label="Approve phone connection"
        >
          <h4>Compare with your phone</h4>
          <p className="phone-pair-number">
            {String(phone.number).slice(0, 3) +
              " " +
              String(phone.number).slice(3)}
          </p>
          <p className="small subtle">Does this number match your phone?</p>
          <div className="library-actions">
            <Button
              id="slideshow-phone-approve"
              variant="secondary"
              onClick={() => onDecide(phone.request, true)}
            >
              Allow phone
            </Button>
            <Button
              id="slideshow-phone-reject"
              variant="ghost"
              onClick={() => onDecide(phone.request, false)}
            >
              Reject
            </Button>
          </div>
        </div>
      ) : phone.paired ? (
        <p className="small">
          Phone connected. Access ends automatically after 15 minutes.
        </p>
      ) : phone.invite ? (
        <div className="phone-invitation">
          <Invitation value={phone.invite} />
          <div>
            <p>Scan to choose and add photos.</p>
            <p className="small subtle">Same Wi-Fi required</p>
          </div>
        </div>
      ) : (
        <p className="small subtle">Preparing a fresh invitation…</p>
      )}
      <Disclosure className="phone-pair-certificate">
        <DisclosureTitle>Connection help</DisclosureTitle>
        <p className="small">
          If your phone shows a certificate warning, compare its fingerprint
          below before continuing. Scan, compare the number, then approve on
          this frame. Invitations refresh automatically; connected access is
          temporary.
        </p>
        <p className="small">Local address: {phone.address}</p>
        <p className="small">{phone.fingerprint}</p>
      </Disclosure>
    </>
  );
}
