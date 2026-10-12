# Wireless updates

Use Android's paired, encrypted wireless ADB when supported by your device.
Both devices must be on the same local Wi-Fi. No router port forwarding or legacy
TCP port 5555 is configured. USB debugging still works.

## First setup: USB to paired Wi-Fi

Use the current official Android SDK platform-tools. This procedure assumes USB
ADB is already authorized and Android offers **Wireless debugging** (verified on
our Android 12 frame). Keep USB attached until the wireless identity check passes.
Pairing itself does not require USB; USB helps identify and prepare the right frame.

1. Run `adb devices -l`, select the intended USB transport, and confirm the physical
   model label. Replace `USB_SERIAL` below with that transport's serial:

   ```sh
   adb -s USB_SERIAL shell getprop ro.product.model
   adb -s USB_SERIAL shell getprop ro.build.version.release
   adb -s USB_SERIAL shell getprop ro.serialno
   ```

   Save the value of `ro.serialno` for the helper. Do not select an arbitrary device
   when more than one is connected.
2. Put the computer and frame on the same local Wi-Fi. Open **Skylit → Settings →
   Device & status → Wireless connection settings**, or **Android Settings → Developer options**.
   If Skylit is not installed yet, an agent can try opening the standard page via
   the selected USB transport:

   ```sh
   adb -s USB_SERIAL shell am start -a android.settings.APPLICATION_DEVELOPMENT_SETTINGS
   ```

   Enable Developer options through the device's normal UI if required. Some frame
   firmware hides/disables this page; an unavailable activity is not permission to
   root, flash or blindly enable system components. The tested-device notes below
   record our earlier device-specific preparation and its undo steps separately.
3. On the frame, turn on **Wireless debugging** and approve the intended local
   network. Choose **Pair device with pairing code**. Keep that dialog open and run:

   ```sh
   adb pair IP:PAIRING_PORT
   ```

   Enter the temporary code at the prompt. Use the pairing dialog's port, not the
   connection port on the main Wireless debugging page. Do not put the code in a
   command argument, chat, screenshots, setup record or source control.
4. Create the ignored `.local/device.json` locally (use the serial from step 1):

   ```json
   {"adb": "/absolute/path/to/platform-tools/adb", "serial": "YOUR_DEVICE_SERIAL"}
   ```

   The file contains no pairing code. Keep addresses and identifiers in private
   local configuration/records, not tracked documentation. Pairing keys are managed
   by ADB on this computer; copying the repository does not pair a different Mac.
5. Verify the wireless path explicitly using the helper, even while USB is attached:

   ```sh
   python3 scripts/frame.py shell getprop ro.product.model
   ```

   It selects a TLS wireless transport and verifies `ro.serialno` before executing
   the command; it does not fall back to USB. If discovery fails, use the current
   **IP address & Port** from the main Wireless debugging page (not its pairing port):

   ```sh
   python3 scripts/frame.py --address IP:CONNECT_PORT shell getprop ro.product.model
   ```

6. Disconnect USB while keeping the frame powered, then repeat the helper command.
   Only claim cable-free operation after it succeeds. Record the model, Android
   version, successful TLS check, actual settings changed and undo steps privately
   on the computer and in the frame's Downloads setup record. Do not record codes
   or private account data. No app rebuild or APK install is required just to pair.

See [Android's pairing instructions](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi).
Use paired TLS, not the legacy `adb tcpip 5555` workflow.

## Updating

From the project directory:

```sh
python3 scripts/frame.py
python3 scripts/build.py
python3 scripts/frame.py install --no-incremental -r dist/skylit.apk
python3 scripts/frame.py shell am start -n com.wesbos.homehq/.MainActivity
```

The helper discovers the current TLS endpoint via mDNS and checks the frame's
serial before running your command. Ports can change after a restart. The local,
ignored `.local/device.json` holds `adb` (executable path) and `serial`.

## After restarting the frame

The restart test preserved pairing but turned wireless debugging off. The frame's
internet access was unavailable during that test. **Automatic cable-free
reconnection after reboot is not established.** No cable is needed to recover it
on the screen:

1. Open **Skylit → Settings → Device & status**. The **Android & wireless updates** card is at the top. Tap **Wi-Fi settings** and toggle Wi-Fi off and on if internet is unavailable.
2. Return to Skylit and tap **Wireless connection settings**, scroll to **Wireless debugging**, and turn it on. Approve the intended network if Android asks.
3. Run the helper again. Pairing should remain; if Android expires it, pair again from that screen.

**Android apps** opens an on-frame picker with **Android Settings** first, followed
by other installed apps. Use it to reach Android’s settings or switch apps without
USB. The tested firmware has no system navigation bar or standard app drawer;
Skylit’s picker does not depend on them. Android Home returns to Skylit when it is
configured as the home screen. Back returns from Android Settings.

The settings shortcuts do not silently change network or debugging state. No
boot helper or privileged settings permission is added. Normal authorization
expiry remains enabled.

For a repeatable connectivity check, use the configured, authorized USB transport
or paired TLS wireless transport:

```sh
python3 scripts/check_network.py --usb --samples 12 --interval 5
python3 scripts/check_network.py --wireless --samples 12 --interval 5
```

The check selects and verifies the configured frame, then tests its actual WLAN
address, Android policy route, router, public IPv4/IPv6 reachability and DNS. It
prints only pass/fail results, never the serial, addresses, network name or feed
URL. A failure exits nonzero. `--wireless` cannot diagnose a frame whose wireless
debugging is off; use USB or the on-frame Wi-Fi settings in that case. A successful
network check does not by itself verify a calendar or photo service: refresh that
feature on the frame too.

Do not infer a missing lease from `getprop dhcp.wlan0.ipaddress` or a missing
default route from `ip route` on this Android 12 device. Both appeared empty during
an October 10 check even though the WLAN had an address and Android's policy route
worked. The frame's retained log also showed repeated failed IPv6 link-local
neighbor probes in that period; the exact source of those failures remains
unconfirmed. [Android's Wi-Fi documentation](https://source.android.com/docs/core/connect/wifi-network-selection)
describes neighbor-unreachability detection as a gateway reachability check; the
retained log alone does not prove a router or access-point fault. Preserve raw logs
privately and avoid changing router settings based on this signal alone.

If discovery fails, open **Skylit → Settings → Wireless connection settings**,
scroll to **Wireless debugging**, and check it is on. Use the address on that page:

```sh
python3 scripts/frame.py --address IP:PORT shell getprop ro.product.model
```

If pairing expires, choose **Pair device with pairing code**, then run
`adb pair IP:PAIRING_PORT` and enter the temporary code shown on the frame. The
pairing port differs from its normal connection port. Android's default debugging
authorization expiry remains enabled; it was not weakened for convenience.

To turn off network access, turn **Use wireless debugging** off. To remove this Mac,
select it under Paired devices and choose Forget. Neither action removes Skylit.

## Tested-device setup record (not a universal procedure)

- `development_settings_enabled`: previously absent, now `1`.
- Enabled the hidden `com.android.settings/.Settings$DevelopmentSettingsDashboardActivity` component.
- Turned Wireless debugging on; allowed the existing home network and paired this Mac.
- Added an app shortcut that opens developer settings; it does not toggle debugging itself.

The original Skylight app/watchdog and all package-disable states are unchanged.
No firmware, Google services, router settings, or saved Wi-Fi credentials changed.

To restore the original hidden developer-menu state via USB after turning wireless off:

```sh
adb -d shell settings delete global development_settings_enabled
adb -d shell 'su 0 pm default-state "com.android.settings/.Settings\$DevelopmentSettingsDashboardActivity"'
```

Source: https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi
