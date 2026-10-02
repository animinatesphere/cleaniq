// Keeps text inputs above the keyboard. On Android the app draws edge-to-edge, so the window no
// longer shrinks when the keyboard opens; instead we measure how much of this view the keyboard
// covers and pad the bottom by exactly that much. iOS uses the built-in KeyboardAvoidingView.
import React, { useEffect, useRef, useState } from "react";
import { View, Keyboard, KeyboardAvoidingView, Platform, Dimensions } from "react-native";

export default function KeyboardSafeView({ style, children, iosOffset = 0, onKeyboardShow }) {
  const ref = useRef(null);
  const [pad, setPad] = useState(0);
  const onShowRef = useRef(onKeyboardShow);
  onShowRef.current = onKeyboardShow;

  useEffect(() => {
    if (Platform.OS !== "android") return undefined;
    let timer;
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      const kbHeight = e?.endCoordinates?.height || 0;
      const screenH = Dimensions.get("screen").height;
      // Phones disagree on whether screenY counts the status bar, so take the higher of the two
      // estimates: the input may sit a few pixels higher, but never under the keyboard.
      const fromHeight = screenH - kbHeight;
      const screenY = e?.endCoordinates?.screenY;
      const kbTop = screenY > 0 ? Math.min(screenY, fromHeight) : fromHeight;
      const measure = () => {
        const node = ref.current;
        if (!node?.measureInWindow) { setPad(kbHeight); return; }
        node.measureInWindow((x, y, w, h) => {
          // How far the bottom of this view reaches below the top of the keyboard. If the phone
          // did shrink the window, the view already ends above the keyboard and this is 0.
          const overlap = Math.round(y + h - kbTop);
          setPad(overlap > 0 ? Math.min(overlap, kbHeight + 60) : 0);
          onShowRef.current?.();
        });
      };
      measure();
      timer = setTimeout(measure, 150); // again once any window resize has settled
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => { clearTimeout(timer); setPad(0); });
    return () => { clearTimeout(timer); show.remove(); hide.remove(); };
  }, []);

  if (Platform.OS === "ios") {
    return (
      <KeyboardAvoidingView style={style} behavior="padding" keyboardVerticalOffset={iosOffset}>
        {children}
      </KeyboardAvoidingView>
    );
  }
  return (
    <View ref={ref} collapsable={false} style={[style, { paddingBottom: pad }]}>
      {children}
    </View>
  );
}
