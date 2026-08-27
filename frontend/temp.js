import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader, Volume2, VolumeX, Mic, Trash2, Sparkles } from "lucide-react";
import NyaiAvatar from "../glb/3DAi.png";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useTTS } from "../hooks/useTTS";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://" + window.location.hostname + ":3001";
const KATEGORI_NAME_TO_ID = {
  "geologika/geografika": "1",
  "geologika": "1",
  "biologika": "2",
  "etnografika": "3",
  "arkeologika": "4",
  "historika": "5",
  "numismatika/heraldika": "6",
  "numismatika": "6",
  "filologika": "7",
  "keramologika": "8",
  "seni rupa": "9",
  "teknologika": "10"
};
const Assistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceChatMode, setIsVoiceChatMode] = useState(false);
  const isVoiceChatModeRef = useRef(false);
  const isSendingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const location = useLocation();
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
    if (isVoiceChatModeRef.current) {
      if (isSpeaking) {
        if (recognitionRef.current) recognitionRef.current.abort();
        setIsListening(false);
      } else {
        if (!isSendingRef.current && !isListening) {
          try {
            startListening();
          } catch (e) {
            console.warn("Failed to restart mic", e);
          }
        }
      }
    }
  }, [isSpeaking]);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const messagesEndRef = useRef(null);
  const lastSpokenIndexRef = useRef(-1);
  const recognitionRef = useRef(null);
  const { speak, stop, isSpeaking } = useTTS();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).substring(7));
  const handleReset = () => {
    setMessages([{ text: t("assistantGreeting"), sender: "nyai" }]);
    setSessionId(Math.random().toString(36).substring(7));
    lastSpokenIndexRef.current = -1;
  };
  const suggestedChips = [
    "Apa itu Etnografika?",
    "Koleksi paling unik?",
    "Kapan museum buka?",
    "Sejarah museum sribaduga"
  ];
  useEffect(() => {
    const greeting = t("assistantGreeting");
    setMessages((prev) => {
      if (prev.length === 0 || prev.length === 1 && prev[0].sender === "nyai") {
        return [{ text: greeting, sender: "nyai", isFinal: true }];
      }
      return prev;
    });
  }, [t]);
  useEffect(() => {
    if (isOpen) {
      if (!isMuted) {
        speak(t("assistantGreeting"), language);
      }
    } else {
      stop();
    }
  }, [isOpen, language]);
  useEffect(() => {
    const handleOpenAssistant = () => setIsOpen(true);
    window.addEventListener("open-assistant", handleOpenAssistant);
    return () => window.removeEventListener("open-assistant", handleOpenAssistant);
  }, []);
  useEffect(() => {
    if (location.pathname === "/catalog" && location.state?.fromHome === true) {
      setIsHidden(true);
    } else {
      setIsHidden(false);
    }
  }, [location.pathname, location.state]);
  useEffect(() => {
    const handleHide = () => setIsHidden(true);
    const handleShow = () => setIsHidden(false);
    window.addEventListener("hide-assistant", handleHide);
    window.addEventListener("show-assistant", handleShow);
    return () => {
      window.removeEventListener("hide-assistant", handleHide);
      window.removeEventListener("show-assistant", handleShow);
    };
  }, []);
  useEffect(() => {
    stop();
    let contextMsg = "";
    if (location.pathname === "/") {
      contextMsg = language === "id" ? "Selamat datang di beranda Museum Sri Baduga." : "Welcome to the Sri Baduga Museum homepage.";
    } else if (location.pathname === "/catalog") {
      if (location.state?.fromHome === true) {
        contextMsg = language === "id" ? "Sampurasun. Selamat datang di Sri Baduga, jelajahi dengan leluasa dan nikmati perjalanan yang nyaman dan berkesan." : "Welcome to Sri Baduga. Explore freely and enjoy a comfortable and memorable journey.";
      }
    } else if (location.pathname.startsWith("/collection/")) {
      const parts = location.pathname.split("/");
      let categoryId = parts[2];
      if (categoryId && categoryId !== "undefined" && categoryId !== "null") {
        categoryId = decodeURIComponent(categoryId).toLowerCase();
        if (KATEGORI_NAME_TO_ID[categoryId]) {
          categoryId = KATEGORI_NAME_TO_ID[categoryId];
        }
        const key = `assistantCollectionContext_${categoryId}`;
        const translated = t(key);
        if (translated !== key) {
          contextMsg = translated;
        }
      }
    }
    if (contextMsg && !isMuted) {
      speak(contextMsg, language);
    }
  }, [location.pathname, t, isMuted, speak, language]);
  useEffect(() => {
    const handleOverlayClosed = () => {
      if (location.pathname === "/catalog" && !isMuted) {
        stop();
        speak(t("assistantCatalogContext"), language);
      }
    };
    window.addEventListener("catalog-overlay-closed", handleOverlayClosed);
    return () => window.removeEventListener("catalog-overlay-closed", handleOverlayClosed);
  }, [location.pathname, t, isMuted, speak, language]);
  useEffect(() => {
    if (messages.length > 0 && !isMuted) {
      const lastIndex = messages.length - 1;
      const lastMsg = messages[lastIndex];
      if (lastMsg.sender === "nyai" && lastMsg.isFinal && lastSpokenIndexRef.current !== lastIndex) {
        lastSpokenIndexRef.current = lastIndex;
        const cleanText = lastMsg.text.replace(/[*#_`~]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\n+/g, ". ");
        speak(cleanText, language);
      }
    }
  }, [messages, isMuted, speak, language]);
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, isOpen]);
  const sendMessageToAPI = async (text) => {
    if (!text.trim()) return;
    stop();
    if (isVoiceChatModeRef.current) {
      if (recognitionRef.current) recognitionRef.current.abort();
      setIsListening(false);
    }
    const currentMessages = [...messages, { text, sender: "user" }];
    setMessages([...currentMessages, { text: "", sender: "nyai", artifacts: [], source: "" }]);
    setIsSending(true);
    isSendingRef.current = true;
    try {
      const res = await fetch(`${API_BASE}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId })
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiAnswer = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop();
        for (const block of blocks) {
          const lines = block.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.replace("data: ", ""));
                if (data.type === "chunk") {
                  aiAnswer += data.text;
                  setMessages((prev) => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], text: aiAnswer };
                    return newMsgs;
                  });
                } else if (data.type === "final") {
                  setMessages((prev) => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = {
                      ...newMsgs[newMsgs.length - 1],
                      source: "ollama_rag",
                      artifacts: data.artifacts || [],
                      options: data.options || [],
                      isFinal: true
                    };
                    return newMsgs;
                  });
                }
              } catch (e) {
              }
            }
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = {
          text: "Maaf, saya sedang tidak dapat merespons. Pastikan server berjalan.",
          sender: "nyai",
          isFinal: true
        };
        return newMsgs;
      });
    } finally {
      setIsSending(false);
      isSendingRef.current = false;
    }
  };
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    const userMsg = input.trim();
    setInput("");
    sendMessageToAPI(userMsg);
  };
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };
  const cancelListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsListening(false);
  };
  const startListening = () => {
    if (!isVoiceChatModeRef.current) {
      stop();
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Maaf, browser Anda tidak mendukung fitur suara (Gunakan Chrome/Edge terbaru).");
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language === "en" ? "en-US" : "id-ID";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
    };
    recognition.onresult = (event) => {
      if (isSendingRef.current || isSpeakingRef.current) return;
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          if (isVoiceChatModeRef.current) {
            stop();
          }
        }
      }
      if (finalTranscript) {
        sendMessageToAPI(finalTranscript);
      }
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      if (isVoiceChatModeRef.current && !isSpeakingRef.current && !isSendingRef.current) {
        setTimeout(() => {
          if (isVoiceChatModeRef.current && !isSpeakingRef.current && !isSendingRef.current) {
            startListening();
          }
        }, 300);
      }
    };
    try {
      recognition.start();
    } catch (e) {
      console.warn("Speech recognition is already running");
    }
  };
  const toggleVoiceChatMode = () => {
    const newState = !isVoiceChatMode;
    setIsVoiceChatMode(newState);
    isVoiceChatModeRef.current = newState;
    if (newState) {
      if (!isListening) {
        startListening();
      }
    } else {
      stopListening();
      stop();
    }
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(AnimatePresence, null, isOpen && !isHidden && /* @__PURE__ */ React.createElement(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(3px)",
        zIndex: 9998
      },
      onClick: () => setIsOpen(false)
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, display: isHidden ? "none" : "flex", flexDirection: "column", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement(AnimatePresence, null, isOpen && /* @__PURE__ */ React.createElement(
    motion.div,
    {
      initial: { opacity: 0, y: 20, scale: 0.9 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 20, scale: 0.9 },
      style: {
        backgroundColor: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px",
        width: "min(calc(100vw - 48px), 380px)",
        height: "450px",
        marginBottom: "20px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
        overflow: "hidden",
        backdropFilter: "blur(10px)"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "8px", height: "8px", backgroundColor: "#4ade80", borderRadius: "50%" } }), /* @__PURE__ */ React.createElement("h3", { style: { margin: 0, fontSize: "1rem", fontWeight: 500, color: "#fff" } }, t("assistantTitle"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleReset,
        title: "Bersihkan Obrolan",
        style: { background: "none", color: "#a3a3a3", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }
      },
      /* @__PURE__ */ React.createElement(Trash2, { size: 16 })
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: toggleVoiceChatMode,
        title: isVoiceChatMode ? "Matikan Mode Ngobrol" : "Mode Ngobrol Otomatis (Beta)",
        style: {
          background: "none",
          color: isVoiceChatMode ? "#ef4444" : "#4ade80",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: "2px 4px",
          borderRadius: "4px",
          transition: "background 0.2s"
        },
        onMouseEnter: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)",
        onMouseLeave: (e) => e.currentTarget.style.background = "none"
      },
      /* @__PURE__ */ React.createElement(Sparkles, { size: 18 }),
      /* @__PURE__ */ React.createElement("span", { style: {
        marginLeft: "6px",
        fontSize: "0.55rem",
        fontWeight: "bold",
        letterSpacing: "0.5px",
        background: isVoiceChatMode ? "rgba(239,68,68,0.2)" : "rgba(74,222,128,0.2)",
        color: isVoiceChatMode ? "#ef4444" : "#4ade80",
        padding: "2px 4px",
        borderRadius: "4px"
      } }, "BETA")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          if (!isMuted) stop();
          setIsMuted((prev) => !prev);
        },
        title: isMuted ? "Aktifkan Suara" : "Matikan Suara",
        style: { background: "none", color: isMuted ? "#6b7280" : "#4ade80", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "2px" }
      },
      isMuted ? /* @__PURE__ */ React.createElement(VolumeX, { size: 18 }) : /* @__PURE__ */ React.createElement(Volume2, { size: 18 })
    ), /* @__PURE__ */ React.createElement("button", { onClick: () => setIsOpen(false), style: { background: "none", color: "#a3a3a3", border: "none", cursor: "pointer" } }, /* @__PURE__ */ React.createElement(X, { size: 20 })))),
    /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", justifyContent: isVoiceChatMode ? "center" : "flex-start" } }, isVoiceChatMode ? /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "40px"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: {
        position: "relative",
        width: "120px",
        height: "120px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      } }, /* @__PURE__ */ React.createElement("div", { style: {
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: isSending ? "radial-gradient(circle at 30% 30%, #fff, #38bdf8 40%, #0284c7 80%, #0369a1)" : isSpeaking ? "radial-gradient(circle at 30% 30%, #fff, #c084fc 40%, #9333ea 80%, #581c87)" : isListening ? "radial-gradient(circle at 30% 30%, #fff, #4ade80 40%, #16a34a 80%, #14532d)" : "radial-gradient(circle at 30% 30%, #fff, #a8a29e 40%, #57534e 80%, #292524)",
        filter: "blur(4px)",
        animation: isSending ? "orbPulseFast 1s ease-in-out infinite alternate" : isSpeaking ? "orbPulseFast 0.8s ease-in-out infinite alternate" : "orbPulseSlow 2s ease-in-out infinite alternate",
        boxShadow: isSending ? "0 0 40px #38bdf8, inset 0 0 20px #fff" : isSpeaking ? "0 0 40px #c084fc, inset 0 0 20px #fff" : isListening ? "0 0 40px #4ade80, inset 0 0 20px #fff" : "0 0 20px #a8a29e, inset 0 0 10px #fff",
        transition: "all 0.5s ease"
      } })),
      /* @__PURE__ */ React.createElement("div", { style: { color: "#fff", fontSize: "1.2rem", fontWeight: 500, textAlign: "center", letterSpacing: "1px" } }, isSending ? "Berpikir..." : isSpeaking ? "Berbicara..." : isListening ? "Mendengarkan..." : "Bicaralah..."),
      /* @__PURE__ */ React.createElement("style", null, `
                      @keyframes orbPulseSlow {
                        0% { transform: scale(0.9) rotate(0deg); border-radius: 50% 55% 45% 50%; }
                        50% { transform: scale(1.05) rotate(180deg); border-radius: 55% 45% 50% 45%; }
                        100% { transform: scale(0.9) rotate(360deg); border-radius: 45% 50% 55% 50%; }
                      }
                      @keyframes orbPulseFast {
                        0% { transform: scale(0.95) rotate(0deg); border-radius: 50%; opacity: 0.8; }
                        50% { transform: scale(1.1) rotate(180deg); border-radius: 52% 48% 50% 52%; opacity: 1; }
                        100% { transform: scale(0.95) rotate(360deg); border-radius: 48% 52% 52% 48%; opacity: 0.8; }
                      }
                      @keyframes orbCore {
                        0% { transform: scale(0.95); opacity: 0.7; }
                        100% { transform: scale(1.05); opacity: 1; }
                      }
                    `)
    ) : messages.map((msg, idx) => /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        key: idx,
        style: {
          alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
          backgroundColor: msg.sender === "user" ? "#C2B280" : "rgba(255,255,255,0.1)",
          color: "#fff",
          padding: "12px 16px",
          borderRadius: "16px",
          borderBottomRightRadius: msg.sender === "user" ? "4px" : "16px",
          borderBottomLeftRadius: msg.sender === "nyai" ? "4px" : "16px",
          maxWidth: "85%",
          fontSize: "0.9rem",
          lineHeight: "1.6",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          whiteSpace: "pre-wrap"
        }
      },
      msg.text,
      msg.sender === "nyai" && /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            const cleanText = msg.text.replace(/[*#_`~]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\n+/g, ". ");
            speak(cleanText);
          },
          title: "Ulangi Audio",
          style: {
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#4ade80",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            marginTop: "10px",
            borderRadius: "12px",
            fontSize: "0.75rem",
            transition: "background 0.2s"
          },
          onMouseEnter: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)",
          onMouseLeave: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"
        },
        /* @__PURE__ */ React.createElement(Volume2, { size: 14 }),
        " Putar Ulang"
      ),
      msg.artifacts && msg.artifacts.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" } }, msg.artifacts.map((art, aIdx) => /* @__PURE__ */ React.createElement("div", { key: aIdx, style: { display: "flex", gap: "4px", width: "100%", alignItems: "stretch" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            if (!isSending) sendMessageToAPI(art.nama_koleksi);
          },
          disabled: isSending,
          style: {
            backgroundColor: "rgba(0,0,0,0.35)",
            padding: "6px 8px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "0.8rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: isSending ? "not-allowed" : "pointer",
            textAlign: "left",
            transition: "all 0.2s",
            flex: 1,
            minWidth: 0
          },
          onMouseEnter: (e) => {
            if (!isSending) {
              e.currentTarget.style.backgroundColor = "rgba(194, 178, 128, 0.2)";
              e.currentTarget.style.borderColor = "rgba(194, 178, 128, 0.5)";
            }
          },
          onMouseLeave: (e) => {
            if (!isSending) {
              e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.35)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }
          }
        },
        /* @__PURE__ */ React.createElement("div", { style: { wordBreak: "break-word", paddingRight: "4px" } }, /* @__PURE__ */ React.createElement("strong", { style: { color: "#fff", display: "block", lineHeight: "1.2", marginBottom: "2px" } }, art.nama_koleksi), art.klasifikasi && /* @__PURE__ */ React.createElement("span", { style: { color: "#a3a3a3", fontSize: "0.7rem" } }, art.klasifikasi)),
        art.no_inventarisasi && /* @__PURE__ */ React.createElement("span", { style: { background: "rgba(194,178,128,0.2)", color: "#C2B280", padding: "2px 4px", borderRadius: "4px", fontSize: "0.65rem", flexShrink: 0 } }, art.no_inventarisasi)
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setIsOpen(false);
            navigate(`/interactive/${art.id}`);
          },
          title: "Tampilkan Halaman Rincian",
          style: {
            backgroundColor: "rgba(194, 178, 128, 0.25)",
            border: "1px solid rgba(194, 178, 128, 0.5)",
            color: "#fff",
            padding: "0 6px",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            fontSize: "0.7rem",
            whiteSpace: "nowrap",
            flexShrink: 0
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.backgroundColor = "rgba(194, 178, 128, 0.4)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.backgroundColor = "rgba(194, 178, 128, 0.25)";
          }
        },
        "Rincian"
      )))),
      msg.options && msg.options.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" } }, msg.options.map((opt, oIdx) => /* @__PURE__ */ React.createElement("div", { key: oIdx, style: { display: "flex", gap: "4px", width: "100%", alignItems: "stretch" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            if (!isSending) sendMessageToAPI(opt);
          },
          disabled: isSending,
          style: {
            background: "rgba(194, 178, 128, 0.15)",
            border: "1px solid rgba(194, 178, 128, 0.4)",
            color: "#fff",
            padding: "6px 8px",
            borderRadius: "8px",
            fontSize: "0.8rem",
            cursor: isSending ? "not-allowed" : "pointer",
            textAlign: "left",
            transition: "all 0.2s",
            flex: 1,
            wordBreak: "break-word",
            lineHeight: "1.2",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          },
          onMouseEnter: (e) => {
            if (!isSending) e.currentTarget.style.background = "rgba(194, 178, 128, 0.3)";
          },
          onMouseLeave: (e) => {
            if (!isSending) e.currentTarget.style.background = "rgba(194, 178, 128, 0.15)";
          }
        },
        /* @__PURE__ */ React.createElement("span", null, "Tampilkan ", /* @__PURE__ */ React.createElement("strong", null, opt))
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setIsOpen(false);
            const catId = KATEGORI_NAME_TO_ID[opt.toLowerCase()] || opt;
            navigate(`/collection/${catId}`);
          },
          title: "Tampilkan Halaman Kategori",
          style: {
            background: "rgba(194, 178, 128, 0.25)",
            border: "1px solid rgba(194, 178, 128, 0.5)",
            color: "#fff",
            padding: "0 6px",
            borderRadius: "8px",
            fontSize: "0.7rem",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            whiteSpace: "nowrap",
            flexShrink: 0
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = "rgba(194, 178, 128, 0.4)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = "rgba(194, 178, 128, 0.25)";
          }
        },
        "Buka"
      ))))
    )), isSending && !isVoiceChatMode && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        style: {
          alignSelf: "flex-start",
          backgroundColor: "rgba(255,255,255,0.1)",
          padding: "12px 16px",
          borderRadius: "16px",
          borderBottomLeftRadius: "4px",
          display: "flex",
          gap: "6px",
          alignItems: "center"
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { width: 7, height: 7, borderRadius: "50%", backgroundColor: "#a3a3a3", animation: "bounce 1.2s infinite 0s" } }),
      /* @__PURE__ */ React.createElement("span", { style: { width: 7, height: 7, borderRadius: "50%", backgroundColor: "#a3a3a3", animation: "bounce 1.2s infinite 0.2s" } }),
      /* @__PURE__ */ React.createElement("span", { style: { width: 7, height: 7, borderRadius: "50%", backgroundColor: "#a3a3a3", animation: "bounce 1.2s infinite 0.4s" } })
    ), /* @__PURE__ */ React.createElement("div", { ref: messagesEndRef })),
    !isVoiceChatMode && messages.length <= 1 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px", overflowX: "auto", padding: "0 15px 15px 15px", scrollbarWidth: "none", msOverflowStyle: "none" } }, suggestedChips.map((chip, idx) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: idx,
        onClick: () => sendMessageToAPI(chip),
        disabled: isSending,
        style: {
          background: "rgba(194, 178, 128, 0.15)",
          border: "1px solid rgba(194, 178, 128, 0.4)",
          color: "#C2B280",
          padding: "6px 12px",
          borderRadius: "16px",
          fontSize: "0.8rem",
          cursor: isSending ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
          transition: "all 0.2s"
        },
        onMouseEnter: (e) => {
          if (!isSending) e.currentTarget.style.background = "rgba(194, 178, 128, 0.3)";
        },
        onMouseLeave: (e) => {
          if (!isSending) e.currentTarget.style.background = "rgba(194, 178, 128, 0.15)";
        }
      },
      chip
    ))),
    /* @__PURE__ */ React.createElement("form", { onSubmit: handleSend, style: { display: "flex", padding: "15px", borderTop: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.2)", gap: "10px" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: input,
        onChange: (e) => setInput(e.target.value),
        placeholder: t("askAssistant"),
        disabled: isSending,
        style: {
          flex: 1,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
          outline: "none",
          padding: "10px 15px",
          borderRadius: "20px",
          fontSize: "0.9rem",
          opacity: isSending ? 0.5 : 1
        }
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: isListening ? stopListening : startListening,
        disabled: isSending,
        title: isListening ? "Kirim Suara" : "Gunakan Suara",
        style: {
          background: isListening ? "#ef4444" : "rgba(255,255,255,0.05)",
          color: isListening ? "#fff" : "#a3a3a3",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          flexShrink: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: isSending ? "not-allowed" : "pointer",
          transition: "all 0.3s",
          boxShadow: isListening ? "0 0 10px rgba(239, 68, 68, 0.6)" : "none"
        }
      },
      isListening ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "3px", height: "16px" } }, /* @__PURE__ */ React.createElement("span", { className: "voice-bar", style: { animationDelay: "0s" } }), /* @__PURE__ */ React.createElement("span", { className: "voice-bar", style: { animationDelay: "0.2s" } }), /* @__PURE__ */ React.createElement("span", { className: "voice-bar", style: { animationDelay: "0.4s" } }), /* @__PURE__ */ React.createElement("span", { className: "voice-bar", style: { animationDelay: "0.1s" } })) : /* @__PURE__ */ React.createElement(Mic, { size: 16 })
    ), isListening ? /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: cancelListening,
        title: "Batal Bicara",
        style: {
          background: "rgba(239, 68, 68, 0.2)",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.5)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          flexShrink: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          transition: "all 0.3s"
        }
      },
      /* @__PURE__ */ React.createElement(X, { size: 16 })
    ) : /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        disabled: isSending || !input.trim(),
        style: {
          background: isSending ? "#6b7280" : "#C2B280",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          flexShrink: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: isSending ? "not-allowed" : "pointer",
          transition: "background 0.3s"
        },
        onMouseEnter: (e) => {
          if (!isSending) e.currentTarget.style.background = "#AD9C69";
        },
        onMouseLeave: (e) => {
          if (!isSending) e.currentTarget.style.background = "#C2B280";
        }
      },
      isSending ? /* @__PURE__ */ React.createElement(Loader, { size: 16, className: "spin" }) : /* @__PURE__ */ React.createElement(Send, { size: 16, style: { marginLeft: "2px" } })
    ))
  )), /* @__PURE__ */ React.createElement(AnimatePresence, null, !isOpen && /* @__PURE__ */ React.createElement(
    motion.div,
    {
      initial: { opacity: 0, y: 20, scale: 0.9 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 20, scale: 0.9 },
      style: { display: "flex", alignItems: "center", gap: "15px", zIndex: 10, position: "relative" }
    },
    /* @__PURE__ */ React.createElement(
      motion.div,
      {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.98 },
        onClick: () => setIsOpen(!isOpen),
        style: {
          backgroundColor: "#fff",
          padding: "12px 24px",
          // More horizontal padding since there's no icon
          borderRadius: "30px",
          border: "1px solid #E5D5B0",
          display: "flex",
          alignItems: "center",
          boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
          position: "relative",
          cursor: "pointer"
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "#555", fontSize: "1.05rem", fontFamily: "inherit" } }, "Tanya Nyai"),
      /* @__PURE__ */ React.createElement("div", { style: {
        position: "absolute",
        top: "50%",
        right: "-6px",
        marginTop: "-7px",
        // half of height to center
        width: "12px",
        height: "12px",
        backgroundColor: "#fff",
        borderTop: "1px solid #E5D5B0",
        borderRight: "1px solid #E5D5B0",
        transform: "rotate(45deg)",
        zIndex: -1
      } })
    ),
    /* @__PURE__ */ React.createElement(
      motion.button,
      {
        whileHover: {
          scale: 1.15,
          rotate: [0, -10, 10, -10, 10, 0],
          transition: { duration: 1, repeat: Infinity }
        },
        whileTap: { scale: 0.95 },
        onClick: () => setIsOpen(!isOpen),
        style: {
          width: "75px",
          height: "75px",
          backgroundColor: "transparent",
          border: "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          position: "relative",
          cursor: "pointer",
          filter: "drop-shadow(0px 8px 15px rgba(0,0,0,0.25))"
        },
        className: "assistant-sprite"
      },
      /* @__PURE__ */ React.createElement("img", { src: NyaiAvatar, alt: "Nyai Avatar", style: { width: "100%", height: "100%", objectFit: "contain" } }),
      messages.length > 1 && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "5px", right: "5px", width: "12px", height: "12px", backgroundColor: "#ef4444", borderRadius: "50%", border: "2px solid #fff" } })
    )
  ))));
};
export default Assistant;
