// Keeps text inputs above the keyboard. Measures how much of this view the keyboard actually
// covers (in window coordinates) and pads the bottom by exactly that much. This works where the
// built-in KeyboardAvoidingView doesn't: Android edge-to-edge (the window no longer shrinks) and
// iOS sheet modals (the screen starts lower than the top of the window).
import React, { useEffect, useRef, useState } from "react";
import { View, Keyboard, Platform, Dimensions, LayoutAnimation } from "react-native";

export default function KeyboardSafeView({ style, children, onKeyboardShow }) {
  const ref = useRef(null);
  const [pad, setPad] = useState(0);
  const onShowRef = useRef(onKeyboardShow);
  onShowRef.current = onKeyboardShow;

  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    const ios = Platform.OS === "ios";
    const animate = (e) => {
      if (ios) LayoutAnimation.configureNext(LayoutAnimation.create(e?.duration || 250, "keyboard", "opacity"));
    };
    let timer;
    const show = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", (e) => {
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
          animate(e);
          setPad(overlap > 0 ? Math.min(overlap, kbHeight + 60) : 0);
          onShowRef.current?.();
        });
      };
      measure();
      if (!ios) timer = setTimeout(measure, 150); // again once any window resize has settled
    });
    const hide = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", (e) => {
      clearTimeout(timer);
      animate(e);
      setPad(0);
    });
    return () => { clearTimeout(timer); show.remove(); hide.remove(); };
  }, []);

  return (
    <View ref={ref} collapsable={false} style={[style, { paddingBottom: pad }]}>
      {children}
    </View>
  );
}
