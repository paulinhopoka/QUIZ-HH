import React, { useState, useEffect, useRef } from 'react';
import { get, set } from 'idb-keyval';
import { motion, AnimatePresence, useMotionValue, animate, useTransform } from 'motion/react';
import { Upload, Play, Search, CheckCircle, Settings, Volume2, VolumeX, Globe, Plus, Trash2, RotateCcw, Maximize, Minimize, Eye, EyeOff, Image as ImageIcon, Crosshair, Youtube, Maximize2, ChevronRight, Star, X } from 'lucide-react';
import { playSound } from './utils/sound';

const YoutubeLogo = ({ className = "", style = {}, size = 24 }: { className?: string, style?: React.CSSProperties, size?: number }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} width={size} height={size}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
    <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF"/>
  </svg>
);

type Lang = 'pt' | 'en' | 'es';

const dict = {
  pt: {
    setupTitle: "Configuração do Jogo",
    titlePlaceholder: "Digite o título do jogo...",
    upload: "Carregar Imagem do Jogo",
    uploadGlass: "Imagem da Lupa (Opcional)",
    uploadLevelCounter: "Imagem do Contador de Fase (Opcional)",
    clickToAdd: "Clique na imagem carregada para esconder itens",
    itemName: "Nome do Item",
    timeLimit: "Tempo (segundos)",
    start: "Começar Jogo",
    reveal: "Solução Automática",
    found: "Encontrados",
    remaining: "Faltam",
    gameOver: "Fim de Tempo! Revelando...",
    youWin: "Você Venceu!",
    playAgain: "Jogar Novamente",
    cancel: "Cancelar",
    save: "Adicionar",
    empty: "Nenhum item adicionado",
    sound: "Som",
    language: "Idioma",
    itemsList: "Itens Escondidos",
    backToSetup: "Voltar para Configuração",
    hideList: "Esconder Lista",
    showList: "Mostrar Lista",
    fullscreen: "Tela Cheia",
    exitFullscreen: "Sair da Tela Cheia",
    lensAdjust: "Ajuste da Lente",
    editMode: "Ajustes Finos",
    editModeHint: "Jogo pausado. Pressione 'A' para sair."
  },
  en: {
    setupTitle: "Game Setup",
    titlePlaceholder: "Enter game title...",
    upload: "Upload Game Image",
    uploadGlass: "Magnifying Glass Image (Optional)",
    uploadLevelCounter: "Level Counter Image (Optional)",
    clickToAdd: "Click on the uploaded image to hide items",
    itemName: "Item Name",
    timeLimit: "Time (seconds)",
    start: "Start Game",
    reveal: "Auto Solve",
    found: "Found",
    remaining: "Remaining",
    gameOver: "Time's Up! Revealing...",
    youWin: "You Win!",
    playAgain: "Play Again",
    cancel: "Cancel",
    save: "Add",
    empty: "No items added",
    sound: "Sound",
    language: "Language",
    itemsList: "Hidden Items",
    backToSetup: "Back to Setup",
    hideList: "Hide List",
    showList: "Show List",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit Fullscreen",
    lensAdjust: "Lens Adjustment",
    editMode: "Fine Tuning",
    editModeHint: "Game paused. Press 'A' to exit."
  },
  es: {
    setupTitle: "Configuración del Juego",
    titlePlaceholder: "Introduce el título del juego...",
    upload: "Subir Imagen del Juego",
    uploadGlass: "Imagen de la Lupa (Opcional)",
    uploadLevelCounter: "Imagen del Contador de Nivel (Opcional)",
    clickToAdd: "Haz clic en la imagen subida para ocultar objetos",
    itemName: "Nombre del Objeto",
    timeLimit: "Tiempo (segundos)",
    start: "Empezar Juego",
    reveal: "Solución Automática",
    found: "Encontrados",
    remaining: "Faltan",
    gameOver: "¡Se acabó el tiempo! Revelando...",
    youWin: "¡Has Ganado!",
    playAgain: "Jugar de Nuevo",
    cancel: "Cancelar",
    save: "Añadir",
    empty: "Ningún objeto añadido",
    sound: "Sonido",
    language: "Idioma",
    itemsList: "Objetos Ocultos",
    backToSetup: "Volver a Configuración",
    hideList: "Ocultar Lista",
    showList: "Mostrar Lista",
    fullscreen: "Pantalla Completa",
    exitFullscreen: "Salir de Pantalla Completa",
    lensAdjust: "Ajuste de la Lente",
    editMode: "Ajustes Finos",
    editModeHint: "Juego pausado. Presiona 'A' para salir."
  }
};

type Item = {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  found: boolean;
  imageCrop?: string;
};

type LevelConfig = {
  id: string;
  title: string;
  image: string | null;
  video?: string | null;
  introVideo?: string | null;
  items: Item[];
  enableCheckpoints?: boolean;
  checkpointCount?: number;
  checkpointImage?: string | null;
  enableIntroVideoTimeBars?: boolean;
  introVideoTimeBarsDuration?: number;
  enableEndVideoTimeBars?: boolean;
  endVideoTimeBarsDuration?: number;
};

const HandMagnifier = ({ phase, image, offset, size = 100, numberSize = 100 }: { phase: number, image?: string | null, offset?: { x: number, y: number }, size?: number, numberSize?: number }) => (
  <div 
    className="relative shrink-0 z-20 pointer-events-auto filter drop-shadow-xl -ml-4 -mt-4 origin-top-left w-56 h-56 md:w-72 md:h-72"
    style={{ 
      transform: `scale(${size / 100})`
    }}
  >
    {image ? (
      <div className="w-full h-full relative">
        <img src={image} className="w-full h-full object-contain" />
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none" 
          style={{ 
            transform: `translate(${offset?.x || 0}%, ${offset?.y || 0}%)`
          }}
        >
          <span className="text-5xl md:text-7xl font-black text-white drop-shadow-md font-sans" style={{ transform: `rotate(-10deg) scale(${numberSize / 100})`, textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            {phase}
          </span>
        </div>
      </div>
    ) : (
      <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Handle */}
        <path d="M20 100 L45 75" stroke="#333" strokeWidth="12" strokeLinecap="round"/>
        <path d="M20 100 L45 75" stroke="#555" strokeWidth="8" strokeLinecap="round"/>
        
        {/* Hand (Stylized) */}
        <path d="M10 110 C 5 90, 15 80, 25 85 C 35 90, 40 100, 30 115 Z" fill="#fca5a5" stroke="#000" strokeWidth="2"/>
        <path d="M15 80 C 20 70, 35 65, 45 75 C 50 80, 40 90, 35 85 Z" fill="#fca5a5" stroke="#000" strokeWidth="2"/>
        <path d="M25 70 C 30 60, 45 55, 55 65 C 60 70, 50 80, 45 75 Z" fill="#fca5a5" stroke="#000" strokeWidth="2"/>
        
        {/* Glass Frame */}
        <circle cx="70" cy="50" r="35" fill="#fff" stroke="#111" strokeWidth="8"/>
        <circle cx="70" cy="50" r="31" fill="#e0f2fe" stroke="#cbd5e1" strokeWidth="2"/>
        
        {/* Reflection */}
        <path d="M45 40 A 25 25 0 0 1 70 20" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
        
        {/* Number */}
        <text x="70" y="50" fontSize={42 * (numberSize / 100)} fontWeight="900" textAnchor="middle" dominantBaseline="central" fill="#111" fontFamily="sans-serif" style={{ textShadow: '2px 2px 0 #fff' }}>
          {phase}
        </text>
        
        {/* Phase Label */}
        <rect x="45" y="90" width="50" height="20" rx="10" fill="#10b981" stroke="#047857" strokeWidth="2"/>
        <text x="70" y="104" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#fff" fontFamily="sans-serif">
          Fase {phase}
        </text>
      </svg>
    )}
  </div>
);

const TimeBar = ({ timeLeft, timeLimit, orientation, trackerImage, trackerImageSize, checkpoints, hitCheckpoints }: { timeLeft: number, timeLimit: number, orientation: 'horizontal' | 'vertical', trackerImage: string | null, trackerImageSize: number, checkpoints?: { count: number, image: string | null }, hitCheckpoints?: number[] }) => {
  const progress = (timeLeft / timeLimit) * 100;
  
  const getColorClass = () => {
    if (progress > 50) return 'bg-stripes-green animate-stripes';
    if (progress > 20) return 'bg-stripes-yellow animate-stripes';
    return 'bg-stripes-red animate-stripes';
  };

  const renderCheckpoints = () => {
    if (!checkpoints || checkpoints.count <= 0 || !checkpoints.image) return null;
    const points = [];
    for (let i = 1; i <= checkpoints.count; i++) {
      const percent = (i / (checkpoints.count + 1)) * 100;
      const isHit = hitCheckpoints?.includes(i);
      if (!isHit) {
        points.push(
          <div 
            key={i} 
            className="absolute z-10 animate-pulse"
            style={{
              [orientation === 'vertical' ? 'bottom' : 'left']: `${percent}%`,
              transform: orientation === 'vertical' ? 'translateY(50%)' : 'translateX(-50%)',
              width: orientation === 'vertical' ? '120%' : 'auto',
              height: orientation === 'vertical' ? 'auto' : '120%',
              aspectRatio: '1/1'
            }}
          >
            <img src={checkpoints.image} className="w-full h-full object-contain drop-shadow-md" />
          </div>
        );
      }
    }
    return points;
  };
  
  if (orientation === 'vertical') {
    return (
      <div className="relative w-12 md:w-16 h-full bg-black/50 rounded-full border-[6px] border-white/80 shadow-xl overflow-hidden flex flex-col justify-end pointer-events-auto shrink-0 items-center">
        <motion.div
          className={`w-full ${getColorClass()}`}
          initial={{ height: '100%' }}
          animate={{ height: `${progress}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
        {renderCheckpoints()}
        {trackerImage && (
          <motion.img 
            src={trackerImage} 
            className="absolute left-1/2 object-contain -translate-x-1/2 z-20 drop-shadow-lg"
            initial={{ bottom: '100%' }}
            animate={{ bottom: `${progress}%` }}
            transition={{ duration: 1, ease: "linear" }}
            style={{ 
              marginBottom: `-${trackerImageSize / 2}px`,
              width: `${trackerImageSize}px`,
              height: `${trackerImageSize}px`
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-12 md:h-16 bg-black/50 rounded-full border-[6px] border-white/80 shadow-xl overflow-hidden pointer-events-auto max-w-4xl mx-auto flex items-center justify-center">
      <motion.div
        className={`absolute left-0 top-0 bottom-0 ${getColorClass()}`}
        initial={{ width: '100%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: "linear" }}
      />
      {renderCheckpoints()}
      {trackerImage && (
        <motion.img 
          src={trackerImage} 
          className="absolute top-1/2 object-contain -translate-y-1/2 z-20 drop-shadow-lg"
          initial={{ left: '100%' }}
          animate={{ left: `${progress}%` }}
          transition={{ duration: 1, ease: "linear" }}
          style={{ 
            marginLeft: `-${trackerImageSize / 2}px`,
            width: `${trackerImageSize}px`,
            height: `${trackerImageSize}px`
          }}
        />
      )}
    </div>
  );
};

const compressImage = (file: File, maxSize: number): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    get(key).then((val) => {
      if (val !== undefined) {
        setValue(val);
      }
      setIsLoaded(true);
    }).catch((err) => {
      console.error(`Error reading indexedDB key "${key}":`, err);
      setIsLoaded(true);
    });
  }, [key]);

  useEffect(() => {
    if (isLoaded) {
      set(key, value).catch((err) => {
        console.error(`Error setting indexedDB key "${key}":`, err);
      });
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        // Ignore quota exceeded errors for localStorage
      }
    }
  }, [key, value, isLoaded]);

  return [value, setValue];
}

export default function App() {
  const [lang, setLang] = useStickyState<Lang>('pt', 'findit_lang');
  const [gameState, setGameState] = useState<'setup' | 'initial_transition' | 'intro' | 'playing' | 'won' | 'lost' | 'waiting_reveal' | 'revealing' | 'transition'>('setup');
  
  const [levelsState, setLevels] = useStickyState<LevelConfig[]>([{
    id: '1',
    title: 'Encontre os Objetos Ocultos',
    image: null,
    video: null,
    introVideo: null,
    items: []
  }], 'findit_levels');
  const levels = Array.isArray(levelsState) ? levelsState : [{
    id: '1',
    title: 'Encontre os Objetos Ocultos',
    image: null,
    video: null,
    introVideo: null,
    items: []
  }];
  const [activeLevelIndex, setActiveLevelIndex] = useStickyState(0, 'findit_active_level_index');
  const levelsRef = useRef(levels);
  const activeLevelIndexRef = useRef(activeLevelIndex);
  const transitionScheduledRef = useRef(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const revealIdRef = useRef(0);
  useEffect(() => {
    levelsRef.current = levels;
    activeLevelIndexRef.current = activeLevelIndex;
  }, [levels, activeLevelIndex]);

  const [nextLevelIndex, setNextLevelIndex] = useState<number | null>(null);
  const [levelTransitionDelay, setLevelTransitionDelay] = useStickyState<number | string>(5, 'findit_level_transition_delay');

  const [channelName, setChannelName] = useStickyState('HiddenHuntYT', 'findit_channel_name');
  const [channelIcon, setChannelIcon] = useStickyState<string | null>(null, 'findit_channel_icon');
  const [watermarkImagesState, setWatermarkImages] = useStickyState<string[]>([], 'findit_watermark_images');
  const watermarkImages = Array.isArray(watermarkImagesState) ? watermarkImagesState : [];
  const [watermarkAnimation, setWatermarkAnimation] = useStickyState<'none' | 'float' | 'spin' | 'pulse' | 'diagonal'>('diagonal', 'findit_watermark_animation');
  const [watermarkOpacityState, setWatermarkOpacity] = useStickyState(0.1, 'findit_watermark_opacity');
  const watermarkOpacity = Number(watermarkOpacityState) || 0.1;
  const [watermarkSpacingXState, setWatermarkSpacingX] = useStickyState(64, 'findit_watermark_spacing_x');
  const watermarkSpacingX = Number(watermarkSpacingXState) || 64;
  const [watermarkSpacingYState, setWatermarkSpacingY] = useStickyState(64, 'findit_watermark_spacing_y');
  const watermarkSpacingY = Number(watermarkSpacingYState) || 64;
  const [watermarkSizeState, setWatermarkSize] = useStickyState(96, 'findit_watermark_size');
  const watermarkSize = Number(watermarkSizeState) || 96;
  const [watermarkQuantityState, setWatermarkQuantity] = useStickyState(100, 'findit_watermark_quantity');
  const watermarkQuantity = Math.max(1, Number(watermarkQuantityState) || 100);
  const [watermarkColor, setWatermarkColor] = useStickyState<'black' | 'white'>('black', 'findit_watermark_color');
  const [backgroundColor, setBackgroundColor] = useStickyState('#F26B24', 'findit_background_color');
  const [backgroundColor2, setBackgroundColor2] = useStickyState('#8B5CF6', 'findit_background_color_2');
  const [bgStyle, setBgStyle] = useStickyState<'solid' | 'split' | 'animated'>('animated', 'findit_bg_style');
  const [enableRewardAnimation, setEnableRewardAnimation] = useStickyState(false, 'findit_enable_reward_animation');
  const [rewardImage, setRewardImage] = useStickyState<string | null>(null, 'findit_reward_image');
  const [enableTimesUp, setEnableTimesUp] = useStickyState(false, 'findit_enable_times_up');
  const [timesUpText, setTimesUpText] = useStickyState("TIME'S UP", 'findit_times_up_text');
  const [imageBorderRadius, setImageBorderRadius] = useStickyState(16, 'findit_image_border_radius');
  const [enableShineBorder, setEnableShineBorder] = useStickyState(false, 'findit_enable_shine_border');
  const [enableDarkStart, setEnableDarkStart] = useStickyState(false, 'findit_enable_dark_start');
  const [darkStartDuration, setDarkStartDuration] = useStickyState(5, 'findit_dark_start_duration');
  const [enableVideoTimeBars, setVideoTimeBars] = useStickyState(false, 'findit_enable_video_time_bars');
  
  const [enableInitialTransition, setEnableInitialTransition] = useStickyState(false, 'findit_enable_initial_transition');
  const [initialTransitionText, setInitialTransitionText] = useStickyState('PREPARE-SE', 'findit_initial_transition_text');
  const [initialTransitionDuration, setInitialTransitionDuration] = useStickyState<number | string>(5, 'findit_initial_transition_duration');
  
  const [transitionSpeed, setTransitionSpeed] = useStickyState<number | string>(1.2, 'findit_transition_speed');
  const [enableVignette, setEnableVignette] = useStickyState(false, 'findit_enable_vignette');
  const [enableImageWobble, setEnableImageWobble] = useStickyState(false, 'findit_enable_image_wobble');
  const [enableRandomBackground, setEnableRandomBackground] = useStickyState(false, 'findit_enable_random_background');
  const [enableStartBackgroundOnly, setEnableStartBackgroundOnly] = useStickyState(false, 'findit_enable_start_bg_only');
  const [startBackgroundOnlyDuration, setStartBackgroundOnlyDuration] = useStickyState<number | string>(5, 'findit_start_bg_only_duration');
  const [enableEndBackgroundOnly, setEnableEndBackgroundOnly] = useStickyState(false, 'findit_enable_end_bg_only');
  
  const [randomBgColors, setRandomBgColors] = useState(['#F26B24', '#1E3A8A']);
  useEffect(() => {
    if (!enableRandomBackground) return;
    const interval = setInterval(() => {
      setRandomBgColors([
        `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
        `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, [enableRandomBackground]);
  
  const [enableChannelOutline, setEnableChannelOutline] = useStickyState(true, 'findit_enable_channel_outline');
  const [fontFamily, setFontFamily] = useStickyState('Inter', 'findit_font_family');
  const [hitCheckpoints, setHitCheckpoints] = useState<number[]>([]);
  
  const [activeRewards, setActiveRewards] = useState<{id: string, x: number, y: number, isCheckpoint?: boolean}[]>([]);
  const [showGameplayMenu, setShowGameplayMenu] = useState(false);
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const defaultUIPositions = {
    levelCounter: { x: 0, y: 0, scale: 1 },
    channelIcon: { x: 0, y: 0, scale: 1 },
    timeBar: { x: 0, y: 0, scale: 1 },
    itemsList: { x: 0, y: 0, scale: 1 },
    videoTimeBarLeft: { x: 0, y: 0, scale: 1 },
    videoTimeBarRight: { x: 0, y: 0, scale: 1 }
  };

  const [uiPositions, setUiPositions] = useState(() => {
    try {
      const saved = localStorage.getItem('findit_ui_positions');
      const parsed = saved ? JSON.parse(saved) : {};
      const safeParsed = typeof parsed === 'object' && parsed !== null ? parsed : {};
      return {
        levelCounter: { ...defaultUIPositions.levelCounter, ...(safeParsed.levelCounter || {}) },
        channelIcon: { ...defaultUIPositions.channelIcon, ...(safeParsed.channelIcon || {}) },
        timeBar: { ...defaultUIPositions.timeBar, ...(safeParsed.timeBar || {}) },
        itemsList: { ...defaultUIPositions.itemsList, ...(safeParsed.itemsList || {}) },
        videoTimeBarLeft: { ...defaultUIPositions.videoTimeBarLeft, ...(safeParsed.videoTimeBarLeft || {}) },
        videoTimeBarRight: { ...defaultUIPositions.videoTimeBarRight, ...(safeParsed.videoTimeBarRight || {}) }
      };
    } catch (error) {
      console.error('Error parsing uiPositions:', error);
      return defaultUIPositions;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('findit_ui_positions', JSON.stringify(uiPositions));
    } catch (error) {
      console.error('Error saving uiPositions:', error);
    }
  }, [uiPositions]);

  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const [resizingElement, setResizingElement] = useState<string | null>(null);
  const [snapLines, setSnapLines] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });
  
  const dragStartPos = useRef({ 
    x: 0, 
    y: 0, 
    startX: 0, 
    startY: 0, 
    startScale: 1,
    startCenterX: 0,
    startCenterY: 0,
    targetCenters: [] as {x: number, y: number}[]
  });

  const handlePointerDown = (e: React.PointerEvent, id: string, type: 'drag' | 'resize') => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();
    
    if (type === 'drag') {
      setDraggingElement(id);
    } else {
      setResizingElement(id);
    }
    
    const currentEl = document.querySelector(`[data-ui-id="${id}"]`) as HTMLElement;
    const currentRect = currentEl?.getBoundingClientRect();
    
    const targetCenters: {x: number, y: number}[] = [];
    for (const tid of ['levelCounter', 'channelIcon', 'timeBar', 'itemsList']) {
      if (tid === id) continue;
      const targetEl = document.querySelector(`[data-ui-id="${tid}"]`) as HTMLElement;
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        targetCenters.push({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
    }

    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      startX: uiPositions[id as keyof typeof uiPositions].x,
      startY: uiPositions[id as keyof typeof uiPositions].y,
      startScale: uiPositions[id as keyof typeof uiPositions].scale,
      startCenterX: currentRect ? currentRect.left + currentRect.width / 2 : 0,
      startCenterY: currentRect ? currentRect.top + currentRect.height / 2 : 0,
      targetCenters
    };
  };

  useEffect(() => {
    if (!isEditMode) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (draggingElement) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        
        let newX = dragStartPos.current.startX + dx;
        let newY = dragStartPos.current.startY + dy;

        let projectedCenterX = dragStartPos.current.startCenterX + dx;
        let projectedCenterY = dragStartPos.current.startCenterY + dy;

        let snapLineX: number | null = null;
        let snapLineY: number | null = null;
        const threshold = 15;

        for (const target of dragStartPos.current.targetCenters) {
          if (Math.abs(projectedCenterX - target.x) < threshold) {
            newX += (target.x - projectedCenterX);
            snapLineX = target.x;
          }
          if (Math.abs(projectedCenterY - target.y) < threshold) {
            newY += (target.y - projectedCenterY);
            snapLineY = target.y;
          }
        }

        setSnapLines({ x: snapLineX, y: snapLineY });

        setUiPositions(prev => ({
          ...prev,
          [draggingElement]: { ...prev[draggingElement as keyof typeof uiPositions], x: newX, y: newY }
        }));
      } else if (resizingElement) {
        const dx = e.clientX - dragStartPos.current.x;
        const scaleDelta = dx * 0.005;
        const newScale = Math.max(0.1, Math.min(5, dragStartPos.current.startScale + scaleDelta));
        
        setUiPositions(prev => ({
          ...prev,
          [resizingElement]: { ...prev[resizingElement as keyof typeof uiPositions], scale: newScale }
        }));
      }
    };

    const handlePointerUp = () => {
      setDraggingElement(null);
      setResizingElement(null);
      setSnapLines({ x: null, y: null });
    };

    if (draggingElement || resizingElement) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isEditMode, draggingElement, resizingElement, uiPositions]);

  // Transition Settings
  const [enableTransitions, setEnableTransitions] = useStickyState(true, 'findit_enable_transitions');
  const transitionSettingsRef = useRef({ enableTransitions, levelTransitionDelay });
  useEffect(() => {
    transitionSettingsRef.current = { enableTransitions, levelTransitionDelay };
  }, [enableTransitions, levelTransitionDelay]);
  const [transitionStyle, setTransitionStyle] = useStickyState<'solid' | 'diagonal'>('solid', 'findit_transition_style');
  const [transitionBgColor, setTransitionBgColor] = useStickyState('#FFD700', 'findit_transition_bg_color');
  const [transitionColorsState, setTransitionColors] = useStickyState(['#FF8C00', '#00BFFF', '#FF1493'], 'findit_transition_colors');
  const transitionColors = Array.isArray(transitionColorsState) ? transitionColorsState : ['#FF8C00', '#00BFFF', '#FF1493'];
  const [transitionCharacter, setTransitionCharacter] = useStickyState<string | null>(null, 'findit_transition_character');

  // Global Game Settings
  const [timeLimit, setTimeLimit] = useStickyState<number | string>(60, 'findit_time_limit');
  const [revealDelay, setRevealDelay] = useStickyState<number | string>(3, 'findit_reveal_delay');
  const [customSound, setCustomSound] = useStickyState<string | null>(null, 'findit_custom_sound');
  const [listDisplayMode, setListDisplayMode] = useStickyState<'name' | 'image' | 'both'>('both', 'findit_list_display_mode');
  const [imageScaleState, setImageScale] = useStickyState(100, 'findit_image_scale');
  const imageScale = Number(imageScaleState) || 100;
  const [glassImage, setGlassImage] = useStickyState<string | null>(null, 'findit_glass_image');
  const [glassCenterState, setGlassCenter] = useStickyState({ x: 50, y: 50 }, 'findit_glass_center');
  const glassCenter = typeof glassCenterState === 'object' && glassCenterState !== null ? glassCenterState : { x: 50, y: 50 };
  const [lensSizeState, setLensSize] = useStickyState(250, 'findit_lens_size');
  const lensSize = Number(lensSizeState) || 250;
  const [timeBarOrientation, setTimeBarOrientation] = useStickyState<'horizontal' | 'vertical'>('horizontal', 'findit_time_bar_orientation');
  const [timeBarTrackerImage, setTimeBarTrackerImage] = useStickyState<string | null>(null, 'findit_time_bar_tracker_image');
  const [levelCounterImage, setLevelCounterImage] = useStickyState<string | null>(null, 'findit_level_counter_image');
  const [levelCounterOffsetState, setLevelCounterOffset] = useStickyState({ x: 0, y: 0 }, 'findit_level_counter_offset');
  const levelCounterOffset = typeof levelCounterOffsetState === 'object' && levelCounterOffsetState !== null ? levelCounterOffsetState : { x: 0, y: 0 };
  const [levelCounterSizeState, setLevelCounterSize] = useStickyState(100, 'findit_level_counter_size');
  const levelCounterSize = Number(levelCounterSizeState) || 100;
  const [levelCounterNumberSizeState, setLevelCounterNumberSize] = useStickyState(100, 'findit_level_counter_number_size');
  const levelCounterNumberSize = Number(levelCounterNumberSizeState) || 100;
  const [levelCounterPositionState, setLevelCounterPosition] = useStickyState({ x: 0, y: 0 }, 'findit_level_counter_position');
  const levelCounterPosition = typeof levelCounterPositionState === 'object' && levelCounterPositionState !== null ? levelCounterPositionState : { x: 0, y: 0 };

  const activeLevel = levels[activeLevelIndex] || levels[0] || {
    id: '1',
    title: 'Encontre os Objetos Ocultos',
    image: null,
    video: null,
    items: []
  };
  if (!activeLevel.items) activeLevel.items = [];
  const updateLevel = (updates: Partial<LevelConfig>) => {
    setLevels(prev => prev.map((lvl, i) => i === activeLevelIndex ? { ...lvl, ...updates } : lvl));
  };

  const [timeLeft, setTimeLeft] = useState(60);
  const [videoTimeLeft, setVideoTimeLeft] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useStickyState(true, 'findit_sound_enabled');
  const [timerSoundEnabled, setTimerSoundEnabled] = useStickyState(true, 'findit_timer_sound_enabled');

  const [newItemPrompt, setNewItemPrompt] = useState<{ x: number, y: number, radius: number } | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const [showList, setShowList] = useStickyState(false, 'findit_show_list');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageRect, setImageRect] = useState<{ width: number, height: number } | null>(null);
  const [trackerImageSizeState, setTrackerImageSize] = useStickyState(150, 'findit_tracker_image_size');
  const trackerImageSize = Number(trackerImageSizeState) || 150;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [darkStartProgress, setDarkStartProgress] = useState(0);

  // Motion values for the magnifying glass
  const glassX = useMotionValue(50);
  const glassY = useMotionValue(50);
  const glassZoom = useMotionValue(1.5);
  const glassScale = useMotionValue(1.0);
  const glassRotation = useMotionValue(0);

  const t = dict[lang];

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const updateRect = () => {
      if (imageContainerRef.current) {
        const rect = imageContainerRef.current.getBoundingClientRect();
        setImageRect({ width: rect.width, height: rect.height });
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    const timeout = setTimeout(updateRect, 100);
    return () => {
      window.removeEventListener('resize', updateRect);
      clearTimeout(timeout);
    };
  }, [gameState, showList, isFullscreen, imageScale]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'initial_transition') {
      timer = setTimeout(() => {
        startLevelAfterInitialTransition();
      }, Number(initialTransitionDuration) * 1000);
    }
    return () => clearTimeout(timer);
  }, [gameState, initialTransitionDuration]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0 && !isPaused) {
      if (timerSoundEnabled) {
        // Only play tick sound on full seconds
        if (Math.abs(timeLeft % 1) < 0.05) {
          if (timeLeft <= 10) {
            playSound('tick_fast', soundEnabled);
            setTimeout(() => playSound('tick_fast', soundEnabled), 500);
          } else {
            playSound('tick', soundEnabled);
          }
        }
      }
      timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 0.1));
      }, 100);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, timerSoundEnabled, soundEnabled, isPaused]);

  useEffect(() => {
    const isIntroBars = gameState === 'intro' && activeLevel.enableIntroVideoTimeBars;
    const isEndBars = (gameState === 'won' || (gameState === 'transition' && nextLevelIndex !== 0)) && activeLevel.video && activeLevel.enableEndVideoTimeBars;
    
    if (isIntroBars || isEndBars) {
      const duration = isIntroBars ? (activeLevel.introVideoTimeBarsDuration || 10) : (activeLevel.endVideoTimeBarsDuration || 10);
      setVideoTimeLeft(duration);
    } else {
      setVideoTimeLeft(null);
    }
  }, [gameState, nextLevelIndex, activeLevel]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (videoTimeLeft !== null && videoTimeLeft > 0 && !isPaused) {
      if (timerSoundEnabled) {
        if (Math.abs(videoTimeLeft % 1) < 0.05) {
          if (videoTimeLeft <= 10) {
            playSound('tick_fast', soundEnabled);
            setTimeout(() => playSound('tick_fast', soundEnabled), 500);
          } else {
            playSound('tick', soundEnabled);
          }
        }
      }
      timer = setInterval(() => {
        setVideoTimeLeft(prev => {
          if (prev === null) return null;
          const next = Math.max(0, prev - 0.1);
          if (next === 0 && prev > 0) {
             playSound('alarm', soundEnabled);
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [videoTimeLeft, timerSoundEnabled, soundEnabled, isPaused]);

  useEffect(() => {
    if (gameState === 'playing' && activeLevel.enableCheckpoints && activeLevel.checkpointCount) {
      const limit = Number(timeLimit) || 60;
      const progress = (timeLeft / limit) * 100;
      
      for (let i = 1; i <= activeLevel.checkpointCount; i++) {
        const percent = (i / (activeLevel.checkpointCount + 1)) * 100;
        if (progress <= percent && !hitCheckpoints.includes(i)) {
          setHitCheckpoints(prev => [...prev, i]);
          playSound('success', soundEnabled);
          
          // Add a visual reward animation at the center of the screen
          const newReward = {
            id: Math.random().toString(36).substring(7),
            x: 50,
            y: 50,
            isCheckpoint: true
          };
          setActiveRewards(prev => [...prev, newReward]);
          setTimeout(() => {
            setActiveRewards(prev => prev.filter(r => r.id !== newReward.id));
          }, 1500);
        }
      }
    }
  }, [timeLeft, gameState, activeLevel.enableCheckpoints, activeLevel.checkpointCount, hitCheckpoints, timeLimit, soundEnabled]);

  // Auto-reveal when time is up
  useEffect(() => {
    if (gameState === 'playing' && timeLeft <= 0) {
      if (timerSoundEnabled) {
        playSound('alarm', soundEnabled);
      } else {
        playSound('lose', soundEnabled);
      }
      setGameState('waiting_reveal');
      setTimeout(() => {
        startReveal();
      }, (Number(revealDelay) || 0) * 1000);
    }
  }, [timeLeft, gameState, timerSoundEnabled, soundEnabled]);

  useEffect(() => {
    if (isEditMode) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  }, [isEditMode]);

  // Keyboard Shortcuts
  const keyBufferRef = useRef('');
  const keyBufferTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (gameState === 'menu' || gameState === 'settings') return;

      if (e.key.toLowerCase() === 'a' && gameState === 'playing') {
        setIsEditMode(prev => !prev);
      }

      if (e.key.toLowerCase() === 'r') {
        startGame(activeLevelIndex);
      } else if (e.key === ' ') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.error(err));
        } else {
          document.exitFullscreen().catch(err => console.error(err));
        }
      } else if (e.key === 'Enter') {
        if (gameState === 'playing') {
          startReveal();
        }
      } else if (/^[0-9]$/.test(e.key)) {
        keyBufferRef.current += e.key;
        
        if (keyBufferTimeout.current) clearTimeout(keyBufferTimeout.current);
        
        keyBufferTimeout.current = setTimeout(() => {
          const levelNum = parseInt(keyBufferRef.current, 10);
          if (levelNum > 0 && levelNum <= levels.length) {
            startGame(levelNum - 1);
          }
          keyBufferRef.current = '';
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeLevelIndex, levels.length]);

  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImage(file, 300);
        newImages.push(compressed);
      }
      setWatermarkImages(prev => [...prev, ...newImages]);
    }
  };

  const removeWatermark = (index: number) => {
    setWatermarkImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleChannelIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 200);
      setChannelIcon(compressed);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 1200);
      updateLevel({ image: compressed, items: [] });
    }
  };

  const handleGlassUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 500);
      setGlassImage(compressed);
    }
  };

  const handleTrackerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 300);
      setTimeBarTrackerImage(compressed);
    }
  };

  const handleLevelCounterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 300);
      setLevelCounterImage(compressed);
    }
  };

  const handleSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomSound(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const playSuccess = () => {
    if (!soundEnabled) return;
    if (customSound) {
      const audio = new Audio(customSound);
      audio.play().catch(e => console.error("Error playing custom sound:", e));
    } else {
      playSound('success', soundEnabled);
    }
  };

  const handleSetupImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (gameState !== 'setup') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewItemPrompt({ x, y, radius: 5 });
    setNewItemName('');
  };

  const confirmNewItem = () => {
    if (newItemName.trim() && newItemPrompt && activeLevel.image) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const x = (newItemPrompt.x / 100) * img.width;
          const y = (newItemPrompt.y / 100) * img.height;
          const r = (newItemPrompt.radius / 100) * img.width;
          
          canvas.width = r * 2;
          canvas.height = r * 2;
          
          ctx.drawImage(img, x - r, y - r, r * 2, r * 2, 0, 0, r * 2, r * 2);
          const imageCrop = canvas.toDataURL('image/png');
          
          updateLevel({ items: [...activeLevel.items, { id: Date.now().toString(), name: newItemName.trim(), x: newItemPrompt.x, y: newItemPrompt.y, radius: newItemPrompt.radius, found: false, imageCrop }] });
          setNewItemPrompt(null);
          playSuccess();
        }
      };
      img.src = activeLevel.image;
    }
  };

  const startGame = (levelIndex = 0) => {
    transitionScheduledRef.current = false;
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    revealIdRef.current += 1; // Cancel any ongoing reveal
    const currentLevels = levelsRef.current;
    const level = currentLevels[levelIndex];
    if (!level || !level.image || level.items.length === 0) return;
    setActiveLevelIndex(levelIndex);
    
    // Reset items for the level
    setLevels(prev => prev.map((lvl, i) => i === levelIndex ? { ...lvl, items: lvl.items.map(it => ({ ...it, found: false })) } : lvl));
    
    setTimeLeft(Number(timeLimit) || 60);
    setDarkStartProgress(enableDarkStart ? 1 : 0);
    setHitCheckpoints([]);
    
    const runInitialTransition = () => {
      if (enableInitialTransition) {
        setNextLevelIndex(0);
        setGameState('transition');
        transitionTimeoutRef.current = setTimeout(() => {
          setNextLevelIndex(null);
          if (level.introVideo) {
            setGameState('intro');
          } else {
            setGameState('playing');
            setShowList(false);
            playSound('reveal', soundEnabled);
          }
        }, (Number(initialTransitionDuration) || 5) * 1000);
      } else {
        if (level.introVideo) {
          setGameState('intro');
        } else {
          setGameState('playing');
          setShowList(false);
          playSound('reveal', soundEnabled);
        }
      }
    };

    if (levelIndex === 0 && enableStartBackgroundOnly) {
      setGameState('start_bg_only');
      transitionTimeoutRef.current = setTimeout(() => {
        runInitialTransition();
      }, (Number(startBackgroundOnlyDuration) || 5) * 1000);
      return;
    }
    
    if (levelIndex === 0) {
      runInitialTransition();
      return;
    }
    
    if (level.introVideo) {
      setGameState('intro');
    } else {
      setGameState('playing');
      setShowList(false);
      playSound('reveal', soundEnabled);
    }
  };

  const startLevelAfterInitialTransition = () => {
    const level = levelsRef.current[0];
    if (level?.introVideo) {
      setGameState('intro');
    } else {
      setGameState('playing');
      setShowList(false);
      playSound('reveal', soundEnabled);
    }
  };

  const startPlayingAfterIntro = () => {
    setGameState('playing');
    setShowList(false);
    playSound('reveal', soundEnabled);
  };

  useEffect(() => {
    let animationFrame: number;
    let startTime: number;

    const animateDarkStart = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const progress = Math.max(0, 1 - (elapsed / darkStartDuration));
      
      setDarkStartProgress(progress);

      if (progress > 0) {
        animationFrame = requestAnimationFrame(animateDarkStart);
      }
    };

    if (gameState === 'playing' && enableDarkStart) {
      setDarkStartProgress(1);
      animationFrame = requestAnimationFrame(animateDarkStart);
    } else {
      setDarkStartProgress(0);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [gameState, enableDarkStart, darkStartDuration]);

  const handlePlayClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (gameState !== 'playing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPxX = e.clientX - rect.left;
    const clickPxY = e.clientY - rect.top;

    let hit = false;
    const newItems = activeLevel.items.map(item => {
      if (!item.found) {
        const itemPxX = (item.x / 100) * rect.width;
        const itemPxY = (item.y / 100) * rect.height;
        const radiusPx = (item.radius / 100) * rect.width;

        const dist = Math.sqrt(Math.pow(itemPxX - clickPxX, 2) + Math.pow(itemPxY - clickPxY, 2));
        if (dist <= radiusPx) {
          hit = true;
          if (enableRewardAnimation) {
            const newReward = { id: Date.now().toString() + Math.random(), x: item.x, y: item.y };
            setActiveRewards(prev => [...prev, newReward]);
            setTimeout(() => {
              setActiveRewards(prev => prev.filter(r => r.id !== newReward.id));
            }, 1500);
          }
          return { ...item, found: true };
        }
      }
      return item;
    });

    if (hit) {
      playSuccess();
      updateLevel({ items: newItems });
      if (newItems.every(i => i.found)) {
        handleLevelComplete();
      }
    } else {
      playSound('error', soundEnabled);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateLevel({ video: url });
    }
  };

  const handleIntroVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateLevel({ introVideo: url });
    }
  };

  const scheduleTransition = (delay = 2000) => {
    if (transitionScheduledRef.current) return;
    transitionScheduledRef.current = true;

    const currentLevels = levelsRef.current;
    const currentIndex = activeLevelIndexRef.current;
    const nextValidLevelIndex = currentLevels.findIndex((l, i) => i > currentIndex && l.image && l.items.length > 0);
    
    if (nextValidLevelIndex !== -1) {
      transitionTimeoutRef.current = setTimeout(() => {
        const { enableTransitions, levelTransitionDelay } = transitionSettingsRef.current;
        if (enableTransitions) {
          setNextLevelIndex(nextValidLevelIndex);
          setGameState('transition');
          transitionTimeoutRef.current = setTimeout(() => {
            startGame(nextValidLevelIndex);
            setNextLevelIndex(null);
          }, (Number(levelTransitionDelay) || 0) * 1000);
        } else {
          startGame(nextValidLevelIndex);
        }
      }, delay);
    } else {
      transitionTimeoutRef.current = setTimeout(() => {
        if (enableEndBackgroundOnly) {
          setNextLevelIndex(currentLevels.length);
          setGameState('transition');
          transitionTimeoutRef.current = setTimeout(() => {
            setNextLevelIndex(null);
            setGameState('end_bg_only');
          }, (Number(levelTransitionDelay) || 0) * 1000);
        } else {
          setGameState('setup');
        }
      }, delay);
    }
  };

  const handleRewardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 200);
      setRewardImage(compressed);
    }
  };

  const handleLevelComplete = () => {
    setGameState('won');
    playSound('win', soundEnabled);
    
    if (!activeLevel.video) {
      scheduleTransition(2000);
    }
  };

  const startReveal = async () => {
    const currentRevealId = ++revealIdRef.current;
    setGameState('revealing');
    const unfound = activeLevel.items.filter(i => !i.found);
    if (unfound.length === 0) {
      handleLevelComplete();
      return;
    }
    
    // Determine closest edge for entry for the FIRST item
    const firstItem = unfound[0];
    const distTop = firstItem.y;
    const distBottom = 100 - firstItem.y;
    const distLeft = firstItem.x;
    const distRight = 100 - firstItem.x;
    
    const minDist = Math.min(distTop, distBottom, distLeft, distRight);
    
    let startX = firstItem.x;
    let startY = firstItem.y;
    
    if (minDist === distTop) {
      startY = -40;
    } else if (minDist === distBottom) {
      startY = 140;
    } else if (minDist === distLeft) {
      startX = -40;
    } else {
      startX = 140;
    }
    
    glassX.set(startX);
    glassY.set(startY);
    glassZoom.set(1.0);
    glassScale.set(1.0);
    glassRotation.set(0);
    
    let currentX = startX;
    let currentY = startY;
    
    for (const item of unfound) {
      if (revealIdRef.current !== currentRevealId) return;
      playSound('reveal', soundEnabled);
      
      const targetLensPx = imageRect ? (item.radius / 100) * imageRect.width * 2 * 1.5 : lensSize;
      const targetScale = Math.max(0.5, Math.min(3.0, targetLensPx / lensSize));
      
      const dx = item.x - currentX;
      const dy = item.y - currentY;
      let targetRotation = dx * 0.5;
      targetRotation = Math.max(-30, Math.min(30, targetRotation));
      
      const midX = currentX + dx * 0.5;
      const midY = currentY + dy * 0.5;
      const curveX = midX + (dy === 0 ? 0 : 20);
      const curveY = midY + (dx === 0 ? 0 : 20);
      
      await Promise.all([
        animate(glassX, [currentX, curveX, item.x], { duration: 1.0, ease: "easeOut", times: [0, 0.5, 1] }),
        animate(glassY, [currentY, curveY, item.y], { duration: 1.0, ease: "easeOut", times: [0, 0.5, 1] }),
        animate(glassZoom, 1.5, { duration: 1.0, ease: "easeOut" }),
        animate(glassScale, targetScale, { duration: 1.0, ease: "easeOut" }),
        animate(glassRotation, targetRotation, { duration: 1.0, ease: "easeOut" })
      ]);
      
      await animate(glassZoom, 3.0, { duration: 0.4, ease: "easeOut" });
      
      if (enableRewardAnimation) {
        const newReward = { id: Date.now().toString() + Math.random(), x: item.x, y: item.y };
        setActiveRewards(prev => [...prev, newReward]);
        setTimeout(() => {
          setActiveRewards(prev => prev.filter(r => r.id !== newReward.id));
        }, 1500);
      }

      setLevels(prev => prev.map((lvl, i) => 
        i === activeLevelIndex 
          ? { ...lvl, items: lvl.items.map(it => it.id === item.id ? { ...it, found: true } : it) } 
          : lvl
      ));
      playSuccess();
      
      await new Promise(r => setTimeout(r, 800));
      if (revealIdRef.current !== currentRevealId) return;
      
      await animate(glassZoom, 1.5, { duration: 0.3, ease: "easeIn" });
      
      currentX = item.x;
      currentY = item.y;
    }
    
    // Exit to closest edge
    const distTopExit = currentY;
    const distBottomExit = 100 - currentY;
    const distLeftExit = currentX;
    const distRightExit = 100 - currentX;
    
    const minDistExit = Math.min(distTopExit, distBottomExit, distLeftExit, distRightExit);
    
    let exitX = currentX;
    let exitY = currentY;
    
    if (minDistExit === distTopExit) {
      exitY = -40;
    } else if (minDistExit === distBottomExit) {
      exitY = 140;
    } else if (minDistExit === distLeftExit) {
      exitX = -40;
    } else {
      exitX = 140;
    }
    
    if (revealIdRef.current !== currentRevealId) return;

    await Promise.all([
      animate(glassX, exitX, { duration: 0.7, ease: "easeIn" }),
      animate(glassY, exitY, { duration: 0.7, ease: "easeIn" }),
      animate(glassRotation, 0, { duration: 0.7, ease: "easeIn" })
    ]);
    
    if (revealIdRef.current !== currentRevealId) return;
    handleLevelComplete();
  };

  const resetGame = () => {
    setGameState('setup');
    setActiveLevelIndex(0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Calculate inner image position based on glass position and zoom
  const currentLensSize = useTransform(glassScale, s => lensSize * s);
  const currentHalfGlass = useTransform(currentLensSize, s => s / 2);
  
  const innerLeft = useTransform([glassX, glassZoom, currentHalfGlass], ([x, z, hg]) => {
    if (!imageRect) return 0;
    const px = (x as number) / 100 * imageRect.width;
    return (hg as number) - px * (z as number);
  });
  
  const innerTop = useTransform([glassY, glassZoom, currentHalfGlass], ([y, z, hg]) => {
    if (!imageRect) return 0;
    const py = (y as number) / 100 * imageRect.height;
    return (hg as number) - py * (z as number);
  });
  
  const innerWidth = useTransform(glassZoom, z => imageRect ? imageRect.width * (z as number) : 0);
  const innerHeight = useTransform(glassZoom, z => imageRect ? imageRect.height * (z as number) : 0);

  const glassLeftStr = useTransform(glassX, x => `${x}%`);
  const glassTopStr = useTransform(glassY, y => `${y}%`);

  const maskLeft = useTransform(currentHalfGlass, hg => -hg);
  const maskTop = useTransform(currentHalfGlass, hg => -hg);

  const customGlassWidth = useTransform(glassScale, s => 600 * s);

  const defaultGlassWidth = useTransform(glassScale, s => 96 * s);
  const defaultGlassHeight = useTransform(glassScale, s => 24 * s);
  const defaultGlassLeft = useTransform(currentHalfGlass, hg => hg * 0.85);
  const defaultGlassTop = useTransform(currentHalfGlass, hg => hg * 0.85);
  const defaultGlassRotate = useTransform(glassRotation, r => r + 45);

  return (
    <>
      <style>{`
        @keyframes bg-diagonal-1 {
          from { transform: translate(0, 0); }
          to { transform: translate(-${watermarkSize * 0.5}px, -${watermarkSize * 0.5}px); }
        }
        @keyframes bg-diagonal-2 {
          from { transform: translate(0, 0); }
          to { transform: translate(-${watermarkSize}px, -${watermarkSize}px); }
        }
        @keyframes bg-diagonal-3 {
          from { transform: translate(0, 0); }
          to { transform: translate(-${watermarkSize * 2}px, -${watermarkSize * 2}px); }
        }
        @keyframes bg-float-1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-${watermarkSize * 0.25}px); }
        }
        @keyframes bg-float-2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-${watermarkSize * 0.5}px); }
        }
        @keyframes bg-float-3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-${watermarkSize}px); }
        }
        @keyframes bg-spin-1 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bg-spin-2 {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes bg-spin-3 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bg-pulse-1 {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes bg-pulse-2 {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes bg-pulse-3 {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
      <motion.div 
        ref={containerRef} 
        className={`min-h-screen text-white font-sans flex flex-col items-center p-4 md:p-8 overflow-hidden ${bgStyle === 'animated' ? 'animated-bg' : ''}`} 
        animate={
          enableRandomBackground 
            ? bgStyle === 'split' 
              ? { background: `linear-gradient(165deg, ${randomBgColors[1]} 50%, ${randomBgColors[0]} 50%)` }
              : bgStyle === 'animated'
                ? { background: `linear-gradient(-45deg, ${randomBgColors[0]}, ${randomBgColors[1]}, ${randomBgColors[0]})`, backgroundSize: '400% 400%' }
                : { backgroundColor: randomBgColors[0] }
            : bgStyle === 'split' || bgStyle === 'animated'
              ? {}
              : { backgroundColor }
        }
        style={{
          ...(!enableRandomBackground && bgStyle === 'split' 
            ? { background: `linear-gradient(165deg, ${backgroundColor2} 50%, ${backgroundColor} 50%)` }
            : {}),
          ...(!enableRandomBackground && bgStyle === 'animated'
            ? { background: `linear-gradient(-45deg, ${backgroundColor}, ${backgroundColor2}, ${backgroundColor})`, backgroundSize: '400% 400%' }
            : {})
        }}
        transition={{ duration: 3, ease: "linear" }}
      >
      
      {/* Watermarks Background */}
      {(gameState === 'playing' || gameState === 'revealing' || gameState === 'won' || gameState === 'lost' || gameState === 'start_bg_only' || gameState === 'end_bg_only' || gameState === 'intro') && watermarkImages.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Layer 1 - Small, slow */}
          <motion.div 
            className="absolute inset-[-100%] w-[300%] h-[300%]"
            style={{ 
              backgroundImage: `url(${watermarkImages[0]})`, 
              backgroundSize: `${watermarkSize * 0.5}px`, 
              backgroundRepeat: 'repeat',
              opacity: watermarkOpacity * 0.3,
              filter: watermarkColor === 'black' ? 'brightness(0)' : 'brightness(2) grayscale(100%)'
            }}
            animate={
              watermarkAnimation === 'diagonal' ? { x: [0, -watermarkSize * 0.5], y: [0, -watermarkSize * 0.5] } :
              watermarkAnimation === 'float' ? { y: [0, -watermarkSize * 0.25, 0] } :
              watermarkAnimation === 'spin' ? { rotate: [0, 360] } :
              watermarkAnimation === 'pulse' ? { scale: [1, 1.1, 1] } :
              {}
            }
            transition={
              watermarkAnimation === 'diagonal' ? { duration: 15, repeat: Infinity, ease: "linear" } :
              watermarkAnimation === 'float' ? { duration: 8, repeat: Infinity, ease: "easeInOut" } :
              watermarkAnimation === 'spin' ? { duration: 30, repeat: Infinity, ease: "linear" } :
              watermarkAnimation === 'pulse' ? { duration: 4, repeat: Infinity, ease: "easeInOut" } :
              {}
            }
          />
          {/* Layer 2 - Medium, medium speed */}
          <motion.div 
            className="absolute inset-[-100%] w-[300%] h-[300%]"
            style={{ 
              backgroundImage: `url(${watermarkImages[watermarkImages.length > 1 ? 1 : 0]})`, 
              backgroundSize: `${watermarkSize}px`, 
              backgroundRepeat: 'repeat',
              opacity: watermarkOpacity * 0.6,
              filter: watermarkColor === 'black' ? 'brightness(0)' : 'brightness(2) grayscale(100%)'
            }}
            animate={
              watermarkAnimation === 'diagonal' ? { x: [0, -watermarkSize], y: [0, -watermarkSize] } :
              watermarkAnimation === 'float' ? { y: [0, -watermarkSize * 0.5, 0] } :
              watermarkAnimation === 'spin' ? { rotate: [0, -360] } :
              watermarkAnimation === 'pulse' ? { scale: [1, 1.15, 1] } :
              {}
            }
            transition={
              watermarkAnimation === 'diagonal' ? { duration: 10, repeat: Infinity, ease: "linear" } :
              watermarkAnimation === 'float' ? { duration: 5, repeat: Infinity, ease: "easeInOut" } :
              watermarkAnimation === 'spin' ? { duration: 20, repeat: Infinity, ease: "linear" } :
              watermarkAnimation === 'pulse' ? { duration: 3, repeat: Infinity, ease: "easeInOut" } :
              {}
            }
          />
          {/* Layer 3 - Large, fast */}
          <motion.div 
            className="absolute inset-[-100%] w-[300%] h-[300%]"
            style={{ 
              backgroundImage: `url(${watermarkImages[watermarkImages.length > 2 ? 2 : 0]})`, 
              backgroundSize: `${watermarkSize * 2}px`, 
              backgroundRepeat: 'repeat',
              opacity: watermarkOpacity,
              filter: watermarkColor === 'black' ? 'brightness(0)' : 'brightness(2) grayscale(100%)'
            }}
            animate={
              watermarkAnimation === 'diagonal' ? { x: [0, -watermarkSize * 2], y: [0, -watermarkSize * 2] } :
              watermarkAnimation === 'float' ? { y: [0, -watermarkSize, 0] } :
              watermarkAnimation === 'spin' ? { rotate: [0, 360] } :
              watermarkAnimation === 'pulse' ? { scale: [1, 1.2, 1] } :
              {}
            }
            transition={
              watermarkAnimation === 'diagonal' ? { duration: 5, repeat: Infinity, ease: "linear" } :
              watermarkAnimation === 'float' ? { duration: 3, repeat: Infinity, ease: "easeInOut" } :
              watermarkAnimation === 'spin' ? { duration: 10, repeat: Infinity, ease: "linear" } :
              watermarkAnimation === 'pulse' ? { duration: 2, repeat: Infinity, ease: "easeInOut" } :
              {}
            }
          />
        </div>
      )}

      {/* Vignette Overlay */}
      {enableVignette && (
        <div className="fixed inset-0 pointer-events-none z-0" style={{ boxShadow: 'inset 0 0 200px rgba(0,0,0,0.9)' }} />
      )}

      {/* Header Controls */}
      {gameState === 'setup' && (
        <div className="w-full max-w-6xl flex justify-between items-center mb-6 relative z-50">
          <div className="flex gap-2 bg-black/30 backdrop-blur-md p-1 rounded-lg border border-white/10">
            {(['pt', 'en', 'es'] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${lang === l ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}
              >
                {l === 'pt' ? 'PT-BR' : l === 'en' ? 'EN-US' : 'ES'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-black/30 backdrop-blur-md rounded-lg border border-white/10 text-white/70 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      )}

      {gameState === 'initial_transition' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="absolute inset-0 flex items-center justify-center bg-black z-50"
        >
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-black text-white tracking-tighter text-center px-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            {initialTransitionText}
          </motion.h1>
        </motion.div>
      ) : gameState === 'setup' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl bg-black/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col gap-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Settings className="text-indigo-400" size={28} />
            <h1 className="text-3xl font-bold">{t.setupTitle}</h1>
          </div>

          <div className="flex items-center justify-between mb-2 bg-black/20 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-4 overflow-x-auto flex-1">
              {levels.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  onClick={() => setActiveLevelIndex(idx)}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${idx === activeLevelIndex ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                >
                  Fase {idx + 1}
                </button>
              ))}
              <button
                onClick={() => {
                  setLevels([...levels, {
                    id: Date.now().toString(),
                    title: `Fase ${levels.length + 1}`,
                    image: null,
                    glassImage: null,
                    glassCenter: { x: 50, y: 50 },
                    lensSize: 250,
                    items: [],
                    timeLimit: 60,
                    revealDelay: 3,
                    customSound: null,
                    listDisplayMode: 'both'
                  }]);
                  setActiveLevelIndex(levels.length);
                }}
                className="px-4 py-2 rounded-xl font-medium whitespace-nowrap bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center gap-2"
              >
                + Nova Fase
              </button>
            </div>
            {levels.length > 1 && (
              <button
                onClick={() => {
                  const newLevels = levels.filter((_, i) => i !== activeLevelIndex);
                  setLevels(newLevels);
                  setActiveLevelIndex(Math.max(0, activeLevelIndex - 1));
                }}
                className="ml-4 p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-xl transition-colors shrink-0"
                title="Remover Fase"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-5">
              <div className="bg-black/20 p-4 rounded-xl border border-white/10 space-y-4">
                <h3 className="font-medium text-emerald-400">Configurações do Canal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Nome do Canal</label>
                    <input
                      type="text"
                      value={channelName}
                      onChange={e => setChannelName(e.target.value)}
                      className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Ícone do Canal</label>
                    <label className="w-full border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center cursor-pointer bg-black/20 transition-colors py-3 h-[46px]">
                      <span className="text-white/60 font-medium text-sm">{channelIcon ? "Trocar Ícone" : "Upload Ícone"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleChannelIconUpload} />
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/10">
                  <div>
                    <h4 className="font-medium text-white text-sm">Contorno no Nome do Canal</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={enableChannelOutline} onChange={e => setEnableChannelOutline(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Estilo do Fundo</label>
                    <select
                      value={bgStyle}
                      onChange={e => setBgStyle(e.target.value as any)}
                      className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none h-[46px]"
                    >
                      <option value="solid" className="bg-gray-900">Cor Sólida</option>
                      <option value="split" className="bg-gray-900">Duas Cores (Diagonal)</option>
                      <option value="animated" className="bg-gray-900">Animado (Gradiente)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Cor de Fundo 1</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={backgroundColor}
                        onChange={e => setBackgroundColor(e.target.value)}
                        className="w-12 h-[46px] rounded-xl cursor-pointer bg-black/30 border border-white/20"
                      />
                      <input 
                        type="text" 
                        value={backgroundColor}
                        onChange={e => setBackgroundColor(e.target.value)}
                        className="flex-1 bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono uppercase"
                      />
                    </div>
                  </div>
                  {bgStyle === 'split' && (
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Cor de Fundo 2</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={backgroundColor2}
                          onChange={e => setBackgroundColor2(e.target.value)}
                          className="w-12 h-[46px] rounded-xl cursor-pointer bg-black/30 border border-white/20"
                        />
                        <input 
                          type="text" 
                          value={backgroundColor2}
                          onChange={e => setBackgroundColor2(e.target.value)}
                          className="flex-1 bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono uppercase"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Marca D'água (Fundo)</label>
                    <label className="w-full border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center cursor-pointer bg-black/20 transition-colors py-3 h-[46px]">
                      <span className="text-white/60 font-medium text-sm">Adicionar Imagem(ns)</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleWatermarkUpload} />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Animação Marca D'água</label>
                    <select
                      value={watermarkAnimation}
                      onChange={e => setWatermarkAnimation(e.target.value as any)}
                      className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none h-[46px]"
                    >
                      <option value="none" className="bg-gray-900">Nenhuma</option>
                      <option value="diagonal" className="bg-gray-900">Diagonal</option>
                      <option value="float" className="bg-gray-900">Flutuar</option>
                      <option value="spin" className="bg-gray-900">Girar</option>
                      <option value="pulse" className="bg-gray-900">Pulsar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Tom da Marca D'água</label>
                    <select
                      value={watermarkColor}
                      onChange={e => setWatermarkColor(e.target.value as any)}
                      className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none h-[46px]"
                    >
                      <option value="black" className="bg-gray-900">Escuro (Sombra)</option>
                      <option value="white" className="bg-gray-900">Claro (Luz)</option>
                    </select>
                  </div>
                </div>
                {watermarkImages.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {watermarkImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} className="w-12 h-12 object-contain bg-black/30 rounded-lg border border-white/10" />
                          <button 
                            onClick={() => removeWatermark(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Opacidade Marca D'água: {Math.round(watermarkOpacity * 100)}%</label>
                      <input 
                        type="range" 
                        min="0.05" 
                        max="1" 
                        step="0.05"
                        value={watermarkOpacity} 
                        onChange={e => setWatermarkOpacity(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Tamanho: {watermarkSize}px</label>
                      <input 
                        type="range" 
                        min="20" 
                        max="300" 
                        step="5"
                        value={watermarkSize} 
                        onChange={e => setWatermarkSize(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-6">
                <h3 className="font-medium text-emerald-400">Animação de Recompensa</h3>
                <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/10">
                  <div>
                    <h4 className="font-medium text-white">Ativar Animação</h4>
                    <p className="text-sm text-white/60">Mostrar objeto e +1 ao encontrar um item</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={enableRewardAnimation} onChange={e => setEnableRewardAnimation(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                
                {enableRewardAnimation && (
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Objeto de Recompensa (ex: Moeda)</label>
                    <div className="flex items-center gap-4">
                      {rewardImage && (
                        <div className="relative group shrink-0">
                          <img src={rewardImage} className="w-12 h-12 object-contain bg-black/30 rounded-lg border border-white/10" />
                          <button 
                            onClick={() => setRewardImage(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                      <label className="flex-1 border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center cursor-pointer bg-black/20 transition-colors py-3 h-[46px]">
                        <span className="text-white/60 font-medium text-sm">{rewardImage ? "Trocar Objeto" : "Upload Objeto"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleRewardImageUpload} />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-6">
                <h3 className="font-medium text-emerald-400">Efeitos e Finalização</h3>
                <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/10">
                  <div>
                    <h4 className="font-medium text-white">Borda Brilhante na Imagem</h4>
                    <p className="text-sm text-white/60">Borda preta com efeito de brilho correndo</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={enableShineBorder} onChange={e => setEnableShineBorder(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Arredondamento da Imagem: {imageBorderRadius}px</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="64" 
                    value={imageBorderRadius} 
                    onChange={e => setImageBorderRadius(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/10 mt-4">
                  <div>
                    <h4 className="font-medium text-white">Transição Inicial</h4>
                    <p className="text-sm text-white/60">Exibe uma tela antes de iniciar a primeira fase</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={enableInitialTransition} onChange={e => setEnableInitialTransition(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {enableInitialTransition && (
                  <div className="flex flex-col gap-4 bg-black/10 p-4 rounded-xl border border-white/5 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Texto da Transição</label>
                      <input 
                        type="text" 
                        value={initialTransitionText} 
                        onChange={e => setInitialTransitionText(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Duração: {initialTransitionDuration}s</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="300"
                        step="0.1"
                        value={initialTransitionDuration} 
                        onChange={e => setInitialTransitionDuration(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Início Apenas Fundo</label>
                    <div className="flex items-center h-[46px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={enableStartBackgroundOnly} onChange={e => setEnableStartBackgroundOnly(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Duração Início Fundo (s)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={startBackgroundOnlyDuration}
                      onChange={e => setStartBackgroundOnlyDuration(e.target.value.replace(/[^0-9.]/g, ''))}
                      className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-[46px]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Fim Apenas Fundo</label>
                    <div className="flex items-center h-[46px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={enableEndBackgroundOnly} onChange={e => setEnableEndBackgroundOnly(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Balanço Imagem Central</label>
                    <div className="flex items-center h-[46px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={enableImageWobble} onChange={e => setEnableImageWobble(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/10 mt-4">
                  <div>
                    <h4 className="font-medium text-white">Barras de Tempo em Vídeos</h4>
                    <p className="text-sm text-white/60">Exibe duas barras verticais (azul e vermelha) durante vídeos de introdução e finalização</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={enableVideoTimeBars} onChange={e => setVideoTimeBars(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/10 mt-4">
                  <div>
                    <h4 className="font-medium text-white">Início Escuro</h4>
                    <p className="text-sm text-white/60">A imagem começa escura e clareia gradualmente</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={enableDarkStart} onChange={e => setEnableDarkStart(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                
                {enableDarkStart && (
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Duração do Clareamento: {darkStartDuration}s</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="30" 
                      value={darkStartDuration} 
                      onChange={e => setDarkStartDuration(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/10 mt-4">
                  <div>
                    <h4 className="font-medium text-white">Tela de Fim de Tempo</h4>
                    <p className="text-sm text-white/60">Mostrar overlay quando o tempo acabar</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={enableTimesUp} onChange={e => setEnableTimesUp(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                {enableTimesUp && (
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Texto de Fim de Tempo</label>
                    <input
                      type="text"
                      value={timesUpText}
                      onChange={e => setTimesUpText(e.target.value)}
                      placeholder="TIME'S UP"
                      className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Título da Fase</label>
                <input
                  type="text"
                  value={activeLevel.title}
                  onChange={e => updateLevel({ title: e.target.value })}
                  placeholder={t.titlePlaceholder}
                  className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">{t.timeLimit}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={timeLimit}
                    onChange={e => setTimeLimit(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Espera Revelar (s)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={revealDelay}
                    onChange={e => setRevealDelay(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Transição Fases (s)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={levelTransitionDelay}
                    onChange={e => setLevelTransitionDelay(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Habilitar Transição</label>
                  <div className="flex items-center h-[46px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={enableTransitions} onChange={e => setEnableTransitions(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Velocidade Transição (s)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={transitionSpeed}
                    onChange={e => setTransitionSpeed(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-[46px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Cores Aleatórias Fundo</label>
                  <div className="flex items-center h-[46px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={enableRandomBackground} onChange={e => setEnableRandomBackground(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Efeito Vinheta</label>
                  <div className="flex items-center h-[46px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={enableVignette} onChange={e => setEnableVignette(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {enableTransitions && (
                <div className="bg-black/20 p-4 rounded-xl border border-white/10 space-y-4">
                  <h3 className="font-medium text-emerald-400">Tela de Transição</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Estilo de Transição</label>
                      <select
                        value={transitionStyle}
                        onChange={e => setTransitionStyle(e.target.value as 'solid' | 'diagonal')}
                        className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none h-[46px]"
                      >
                        <option value="solid" className="bg-gray-900">Cor Sólida</option>
                        <option value="diagonal" className="bg-gray-900">3 Cores Diagonal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Personagem (Opcional)</label>
                      <label className="w-full border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center cursor-pointer bg-black/20 transition-colors py-2 h-[46px]">
                        <span className="text-white/60 font-medium text-xs">{transitionCharacter ? "Trocar Imagem" : "Upload Imagem"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setTransitionCharacter(URL.createObjectURL(file));
                        }} />
                      </label>
                    </div>
                  </div>

                  {transitionStyle === 'solid' ? (
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Cor de Fundo</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={transitionBgColor} 
                          onChange={e => setTransitionBgColor(e.target.value)}
                          className="w-full h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Cores da Transição (Topo, Meio, Fundo)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={transitionColors[0]} 
                          onChange={e => setTransitionColors([e.target.value, transitionColors[1], transitionColors[2]])}
                          className="flex-1 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input 
                          type="color" 
                          value={transitionColors[1]} 
                          onChange={e => setTransitionColors([transitionColors[0], e.target.value, transitionColors[2]])}
                          className="flex-1 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input 
                          type="color" 
                          value={transitionColors[2]} 
                          onChange={e => setTransitionColors([transitionColors[0], transitionColors[1], e.target.value])}
                          className="flex-1 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Exibição da Lista</label>
                  <select
                    value={listDisplayMode}
                    onChange={e => setListDisplayMode(e.target.value as 'name' | 'image' | 'both')}
                    className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    <option value="name" className="bg-gray-900">Apenas Nome</option>
                    <option value="image" className="bg-gray-900">Apenas Imagem</option>
                    <option value="both" className="bg-gray-900">Imagem + Nome</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Orientação da Barra de Tempo</label>
                  <select
                    value={timeBarOrientation}
                    onChange={e => setTimeBarOrientation(e.target.value as 'horizontal' | 'vertical')}
                    className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    <option value="horizontal" className="bg-gray-900">Horizontal</option>
                    <option value="vertical" className="bg-gray-900">Vertical</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Tamanho da Imagem Central (%)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="50" 
                      max="150" 
                      value={imageScale} 
                      onChange={e => setImageScale(Number(e.target.value))}
                      className="flex-1 accent-indigo-500"
                    />
                    <span className="text-white/80 text-sm font-medium w-10">{imageScale}%</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Imagem Rastreador (Opcional)</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center cursor-pointer bg-black/20 transition-colors py-2 h-12">
                      <span className="text-white/60 font-medium text-xs">{timeBarTrackerImage ? "Trocar" : "Upload"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleTrackerUpload} />
                    </label>
                    {timeBarTrackerImage && (
                      <button onClick={() => setTimeBarTrackerImage(null)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-red-400 transition-colors shrink-0 h-12 w-12 flex items-center justify-center">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  {timeBarTrackerImage && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-white/50 mb-1">Tamanho da Imagem ({trackerImageSize}px)</label>
                      <input 
                        type="range" 
                        min="50" max="300" 
                        value={trackerImageSize} 
                        onChange={(e) => setTrackerImageSize(parseInt(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {activeLevelIndex === 0 && (
                <div className="flex flex-col gap-2">
                  <label className="block text-sm font-medium text-white/70 mb-1">{t.uploadLevelCounter}</label>
                  <div className="flex items-center gap-4">
                    {levelCounterImage && (
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-black/40 border border-white/20 flex items-center justify-center shrink-0">
                        <img 
                          src={levelCounterImage} 
                          className="max-w-full max-h-full object-contain cursor-crosshair" 
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ((e.clientX - rect.left - rect.width / 2) / rect.width) * 100;
                            const y = ((e.clientY - rect.top - rect.height / 2) / rect.height) * 100;
                            setLevelCounterOffset({ x, y });
                          }}
                          draggable={false}
                          title="Clique para definir a posição do número"
                        />
                        <div 
                          className="absolute inset-0 flex items-center justify-center pointer-events-none" 
                          style={{ 
                            transform: `translate(${levelCounterOffset.x}%, ${levelCounterOffset.y}%)`
                          }}
                        >
                          <span className="text-3xl font-black text-white drop-shadow-md font-sans" style={{ transform: 'rotate(-10deg)', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                            1
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="flex-1 border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-black/20 transition-colors py-2 h-16">
                        <span className="text-white/60 font-medium text-sm">{levelCounterImage ? "Trocar Imagem" : "Upload Imagem"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLevelCounterUpload} />
                      </label>
                      {levelCounterImage && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-white/50 mb-1">Posição X</label>
                            <input 
                              type="range" 
                              min="-200" max="200" 
                              value={levelCounterOffset.x} 
                              onChange={(e) => setLevelCounterOffset(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                              className="w-full accent-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/50 mb-1">Posição Y</label>
                            <input 
                              type="range" 
                              min="-200" max="200" 
                              value={levelCounterOffset.y} 
                              onChange={(e) => setLevelCounterOffset(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                              className="w-full accent-indigo-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {levelCounterImage && (
                      <button onClick={() => setLevelCounterImage(null)} className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-red-400 transition-colors shrink-0 h-32 w-16 flex items-center justify-center">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-white/70 mb-2">Tamanho do Contador de Fases</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="50" max="250" 
                        value={levelCounterSize} 
                        onChange={(e) => setLevelCounterSize(parseInt(e.target.value))}
                        className="flex-1 accent-indigo-500"
                      />
                      <span className="text-white/50 text-sm w-12 text-right">{levelCounterSize}%</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-white/70 mb-2">Tamanho do Número da Fase</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="50" max="250" 
                        value={levelCounterNumberSize} 
                        onChange={(e) => setLevelCounterNumberSize(parseInt(e.target.value))}
                        className="flex-1 accent-indigo-500"
                      />
                      <span className="text-white/50 text-sm w-12 text-right">{levelCounterNumberSize}%</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Posição X da Lupa</label>
                      <input 
                        type="range" 
                        min="-200" max="200" 
                        value={levelCounterPosition.x} 
                        onChange={(e) => setLevelCounterPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Posição Y da Lupa</label>
                      <input 
                        type="range" 
                        min="-200" max="200" 
                        value={levelCounterPosition.y} 
                        onChange={(e) => setLevelCounterPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeLevelIndex === 0 && (
                <div className="flex flex-col gap-2">
                  <label className="block text-sm font-medium text-white/70 mb-1">{t.uploadGlass}</label>
                  <div className="flex items-center gap-4">
                  {glassImage && (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-black/40 border border-white/20 flex items-center justify-center shrink-0">
                      <div className="relative inline-flex max-w-full max-h-full">
                        <img 
                          src={glassImage} 
                          className="max-w-full max-h-full block cursor-crosshair" 
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            setGlassCenter({ x, y });
                          }}
                          draggable={false}
                          title="Clique para definir o centro da lupa"
                        />
                        <div 
                          className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-md z-10" 
                          style={{ left: `${glassCenter.x}%`, top: `${glassCenter.y}%` }} 
                        />
                        <div 
                          className="absolute rounded-full border-2 border-blue-400/80 bg-blue-400/30 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ 
                            left: `${glassCenter.x}%`, 
                            top: `${glassCenter.y}%`,
                            width: `${(lensSize / 600) * 100}%`,
                            aspectRatio: '1 / 1'
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <label className="flex-1 border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center cursor-pointer bg-black/20 transition-colors py-3 h-24">
                    <ImageIcon size={20} className="text-white/40 mr-2" />
                    <span className="text-white/60 font-medium text-sm">{glassImage ? "Trocar Lupa" : "Upload Lupa"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleGlassUpload} />
                  </label>
                  {glassImage && (
                    <button onClick={() => { setGlassImage(null); setGlassCenter({x: 50, y: 50}); setLensSize(250); }} className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-red-400 transition-colors shrink-0 h-24 w-16 flex items-center justify-center">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
                {glassImage && (
                  <p className="text-xs text-emerald-400 mt-1">Clique na imagem da lupa acima para definir o ponto central (onde o objeto será focado).</p>
                )}
                
                {glassImage && (
                  <div className="bg-black/30 p-4 rounded-xl border border-white/10 mt-2 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/50 w-24">Área Clara:</span>
                      <input type="range" min="20" max="400" value={lensSize} onChange={e => setLensSize(Number(e.target.value))} className="flex-1" />
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col gap-2 mt-4">
                  <label className="block text-sm font-medium text-white/70 mb-1">Som de Acerto (Opcional)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center cursor-pointer bg-black/20 transition-colors py-3 h-16">
                      <Volume2 size={20} className="text-white/40 mr-2" />
                      <span className="text-white/60 font-medium text-sm">{customSound ? "Trocar Som" : "Upload de Som"}</span>
                      <input type="file" accept="audio/*" className="hidden" onChange={handleSoundUpload} />
                    </label>
                    {customSound && (
                      <button onClick={() => setCustomSound(null)} className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-red-400 transition-colors shrink-0 h-16 w-16 flex items-center justify-center">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )}

              <div className="bg-black/20 rounded-xl p-4 border border-white/10 flex-1 min-h-[150px]">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-400" />
                  {t.itemsList} ({activeLevel.items.length})
                </h3>
                {activeLevel.items.length === 0 ? (
                  <p className="text-white/40 text-sm italic">{t.empty}</p>
                ) : (
                  <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {activeLevel.items.map((item, index) => (
                      <li 
                        key={item.id} 
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', index.toString());
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                          const toIndex = index;
                          if (fromIndex !== toIndex) {
                            const newItems = [...activeLevel.items];
                            const [movedItem] = newItems.splice(fromIndex, 1);
                            newItems.splice(toIndex, 0, movedItem);
                            updateLevel({ items: newItems });
                          }
                        }}
                        className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2 text-sm cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 cursor-grab">⋮⋮</span>
                          <span>{item.name}</span>
                        </div>
                        <button onClick={() => updateLevel({ items: activeLevel.items.filter(i => i.id !== item.id) })} className="text-red-400 hover:text-red-300">
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-white/70 mb-1">Vídeo de Introdução (Opcional)</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center cursor-pointer bg-black/20 transition-colors py-3 h-16">
                    <Play size={20} className="text-white/40 mr-2" />
                    <span className="text-white/60 font-medium text-sm">{activeLevel.introVideo ? "Trocar Vídeo Intro" : "Upload Vídeo Intro"}</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleIntroVideoUpload} />
                  </label>
                  {activeLevel.introVideo && (
                    <button onClick={() => updateLevel({ introVideo: null })} className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-red-400 transition-colors shrink-0 h-16 w-16 flex items-center justify-center">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
                {activeLevel.introVideo && (
                  <div className="bg-black/20 p-4 rounded-xl border border-white/10 space-y-4 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white text-sm">Barras de Tempo no Vídeo Intro</h4>
                        <p className="text-xs text-white/60">Exibe barras laterais durante o vídeo</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={activeLevel.enableIntroVideoTimeBars || false} onChange={e => updateLevel({ enableIntroVideoTimeBars: e.target.checked })} className="sr-only peer" />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                    {activeLevel.enableIntroVideoTimeBars && (
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1">Duração das Barras: {activeLevel.introVideoTimeBarsDuration || 10}s</label>
                        <input 
                          type="range" 
                          min="1" 
                          max="60" 
                          value={activeLevel.introVideoTimeBarsDuration || 10} 
                          onChange={e => updateLevel({ introVideoTimeBarsDuration: Number(e.target.value) })}
                          className="w-full accent-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-white/70 mb-1">Vídeo de Solução (Opcional)</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center cursor-pointer bg-black/20 transition-colors py-3 h-16">
                    <Play size={20} className="text-white/40 mr-2" />
                    <span className="text-white/60 font-medium text-sm">{activeLevel.video ? "Trocar Vídeo Final" : "Upload Vídeo Final"}</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                  </label>
                  {activeLevel.video && (
                    <button onClick={() => updateLevel({ video: null })} className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-red-400 transition-colors shrink-0 h-16 w-16 flex items-center justify-center">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
                {activeLevel.video && (
                  <div className="bg-black/20 p-4 rounded-xl border border-white/10 space-y-4 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white text-sm">Barras de Tempo no Vídeo Final</h4>
                        <p className="text-xs text-white/60">Exibe barras laterais durante o vídeo</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={activeLevel.enableEndVideoTimeBars || false} onChange={e => updateLevel({ enableEndVideoTimeBars: e.target.checked })} className="sr-only peer" />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                    {activeLevel.enableEndVideoTimeBars && (
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1">Duração das Barras: {activeLevel.endVideoTimeBarsDuration || 10}s</label>
                        <input 
                          type="range" 
                          min="1" 
                          max="60" 
                          value={activeLevel.endVideoTimeBarsDuration || 10} 
                          onChange={e => updateLevel({ endVideoTimeBarsDuration: Number(e.target.value) })}
                          className="w-full accent-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-black/20 p-4 rounded-xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white text-sm">Checkpoints na Barra de Tempo</h4>
                    <p className="text-xs text-white/60">Adiciona marcadores na barra de tempo</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={activeLevel.enableCheckpoints || false} onChange={e => updateLevel({ enableCheckpoints: e.target.checked })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                
                {activeLevel.enableCheckpoints && (
                  <div className="space-y-4 pt-2 border-t border-white/10">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Quantidade de Checkpoints: {activeLevel.checkpointCount || 0}</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="4" 
                        value={activeLevel.checkpointCount || 0} 
                        onChange={e => updateLevel({ checkpointCount: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Imagem do Checkpoint</label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center cursor-pointer bg-black/20 transition-colors py-3 h-16">
                          {activeLevel.checkpointImage ? (
                            <img src={activeLevel.checkpointImage} className="h-10 object-contain" />
                          ) : (
                            <span className="text-white/60 font-medium text-sm">Upload Imagem</span>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              updateLevel({ checkpointImage: url });
                            }
                          }} />
                        </label>
                        {activeLevel.checkpointImage && (
                          <button onClick={() => updateLevel({ checkpointImage: null })} className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-red-400 transition-colors shrink-0 h-16 w-16 flex items-center justify-center">
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => startGame(activeLevelIndex)}
                disabled={!activeLevel.image || activeLevel.items.length === 0}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Play size={24} /> {t.start}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-white/70 mb-1">{t.upload}</label>
              {!activeLevel.image ? (
                <label className="flex-1 border-2 border-dashed border-white/20 hover:border-white/40 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-black/20 transition-colors min-h-[400px]">
                  <Upload size={48} className="text-white/40 mb-4" />
                  <span className="text-white/60 font-medium">{t.upload}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="relative flex-1 rounded-2xl overflow-hidden border border-white/20 bg-black/40 flex items-center justify-center min-h-[400px]">
                  <div className="relative inline-flex max-w-full max-h-full">
                    <img src={activeLevel.image} className="max-w-full max-h-full object-contain cursor-crosshair" onClick={handleSetupImageClick} draggable={false} />
                    {showPreviewOverlay && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10 pointer-events-none z-50">
                        {t.clickToAdd}
                      </div>
                    )}
                    
                    {/* Setup Markers */}
                    {activeLevel.items.map(item => (
                      <div
                        key={item.id}
                        className="absolute rounded-full border-2 border-emerald-400 bg-emerald-400/20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-40"
                        style={{ 
                          left: `${item.x}%`, 
                          top: `${item.y}%`,
                          width: `${item.radius * 2}%`,
                          aspectRatio: '1 / 1'
                        }}
                      />
                    ))}

                    {/* Live Preview Overlay */}
                    {showPreviewOverlay && (
                      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-xl">
                        {/* Watermark Preview */}
                        {watermarkImages.length > 0 && (
                          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                            <div 
                              className="absolute inset-0"
                              style={{ 
                                backgroundImage: `url(${watermarkImages[0]})`, 
                                backgroundSize: `${watermarkSize * 0.5}px`, 
                                backgroundRepeat: 'repeat',
                                opacity: watermarkOpacity * 0.6,
                                filter: watermarkColor === 'black' ? 'brightness(0)' : 'brightness(2) grayscale(100%)'
                              }}
                            />
                          </div>
                        )}

                        {/* Top Bar Preview */}
                        <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start">
                          <div className="transform scale-50 origin-top-left" style={{ transform: `scale(0.5) translate(${levelCounterPosition.x}px, ${levelCounterPosition.y}px)` }}>
                            <HandMagnifier phase={activeLevelIndex + 1} image={levelCounterImage} offset={levelCounterOffset} size={levelCounterSize} numberSize={levelCounterNumberSize} />
                          </div>
                          <div className="absolute inset-x-0 top-2 flex items-center justify-center">
                            <h1 className="text-sm md:text-base font-black text-white text-center uppercase tracking-wider font-sans drop-shadow-2xl" style={{ WebkitTextStroke: '0.5px black', textShadow: '1px 1px 0 #000, 2px 2px 5px rgba(0,0,0,0.5)' }}>
                              {activeLevel.title}
                            </h1>
                          </div>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden relative drop-shadow-xl bg-amber-500 border-2 border-amber-700">
                            {channelIcon ? (
                              <img src={channelIcon} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-black text-[10px]">YT</span>
                            )}
                          </div>
                        </div>

                        {/* Right: Vertical Time Bar Preview */}
                        {timeBarOrientation === 'vertical' && (
                          <div className="absolute right-2 top-16 bottom-10 w-10 flex justify-center origin-center transform scale-75 origin-right">
                            <TimeBar timeLeft={Number(timeLimit) || 60} timeLimit={Number(timeLimit) || 60} orientation="vertical" trackerImage={timeBarTrackerImage} trackerImageSize={trackerImageSize * 0.5} checkpoints={activeLevel.enableCheckpoints ? { count: activeLevel.checkpointCount || 0, image: activeLevel.checkpointImage || null } : undefined} hitCheckpoints={hitCheckpoints} />
                            {channelName && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                                <div className="flex items-center gap-1 transform -rotate-90 whitespace-nowrap">
                                  <YoutubeLogo size={12} className="drop-shadow-md" />
                                  <span className="text-xs font-black text-white/80 uppercase tracking-widest drop-shadow-md" style={enableChannelOutline ? { WebkitTextStroke: '0.5px black', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8)' } : {}}>
                                    {channelName}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bottom Bar Preview */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col gap-2">
                          {/* Horizontal Time Bar Preview */}
                          {timeBarOrientation === 'horizontal' && (
                            <div className="w-full transform scale-75 origin-bottom relative h-12">
                              <TimeBar timeLeft={Number(timeLimit) || 60} timeLimit={Number(timeLimit) || 60} orientation="horizontal" trackerImage={timeBarTrackerImage} trackerImageSize={trackerImageSize * 0.5} checkpoints={activeLevel.enableCheckpoints ? { count: activeLevel.checkpointCount || 0, image: activeLevel.checkpointImage || null } : undefined} hitCheckpoints={hitCheckpoints} />
                              {channelName && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                                  <div className="flex items-center gap-1">
                                    <YoutubeLogo size={12} className="drop-shadow-md" />
                                    <span className="text-xs font-bold text-white/90 uppercase tracking-widest drop-shadow-md" style={enableChannelOutline ? { WebkitTextStroke: '0.5px black', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8)' } : {}}>
                                      {channelName}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* New Item Prompt */}
                    {newItemPrompt && (
                      <>
                        <div 
                          className="absolute rounded-full border-2 border-dashed border-white bg-white/20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                          style={{ 
                            left: `${newItemPrompt.x}%`, 
                            top: `${newItemPrompt.y}%`,
                            width: `${newItemPrompt.radius * 2}%`,
                            aspectRatio: '1 / 1'
                          }}
                        />
                        <div className="absolute z-50 bg-white text-black p-3 rounded-xl shadow-2xl flex flex-col gap-2 w-56 transform -translate-x-1/2 -translate-y-full mt-[-15px]"
                          style={{ left: `${newItemPrompt.x}%`, top: `${newItemPrompt.y}%` }}
                        >
                          <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
                          <input 
                            autoFocus
                            type="text" 
                            placeholder={t.itemName}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && confirmNewItem()}
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">Tamanho:</span>
                            <input 
                              type="range" 
                              min="1" 
                              max="20" 
                              value={newItemPrompt.radius} 
                              onChange={e => setNewItemPrompt({ ...newItemPrompt, radius: Number(e.target.value) })}
                              className="flex-1"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setNewItemPrompt(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">{t.cancel}</button>
                            <button onClick={confirmNewItem} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors">{t.save}</button>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button onClick={() => setShowPreviewOverlay(!showPreviewOverlay)} className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-colors" title={showPreviewOverlay ? "Esconder pré-visualização" : "Mostrar pré-visualização"}>
                        {showPreviewOverlay ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => updateLevel({ image: null })} className="p-2 bg-black/60 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white transition-colors" title="Remover imagem">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col z-10 overflow-hidden"
        >
          <AnimatePresence>
            {gameState === 'transition' && nextLevelIndex !== null && (
              <motion.div 
                className="absolute inset-0 z-[100] flex items-center justify-center overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {transitionStyle === 'solid' ? (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ duration: (Number(transitionSpeed) || 1.2) * 0.66, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                    style={{ backgroundColor: transitionBgColor }}
                  />
                ) : (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                    <motion.div
                      className="absolute w-[200vw] h-[200vh] rotate-45"
                      style={{ backgroundColor: transitionColors[0] }}
                      initial={{ x: '-100%' }}
                      animate={{ x: ['-100%', '0%', '0%', '100%'] }}
                      transition={{ duration: Number(transitionSpeed) || 1.2, times: [0, 0.4, 0.6, 1], ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute w-[200vw] h-[200vh] rotate-45"
                      style={{ backgroundColor: transitionColors[1] }}
                      initial={{ x: '-100%' }}
                      animate={{ x: ['-100%', '0%', '0%', '100%'] }}
                      transition={{ duration: Number(transitionSpeed) || 1.2, times: [0, 0.4, 0.6, 1], ease: "easeInOut", delay: 0.1 }}
                    />
                    <motion.div
                      className="absolute w-[200vw] h-[200vh] rotate-45"
                      style={{ backgroundColor: transitionColors[2] }}
                      initial={{ x: '-100%' }}
                      animate={{ x: ['-100%', '0%', '0%', '100%'] }}
                      transition={{ duration: Number(transitionSpeed) || 1.2, times: [0, 0.4, 0.6, 1], ease: "easeInOut", delay: 0.2 }}
                    />
                  </div>
                )}

                <motion.div 
                  className="relative z-10 flex items-center gap-8 drop-shadow-2xl"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: "backOut" }}
                >
                  {transitionCharacter && (
                    <motion.img 
                      src={transitionCharacter} 
                      className="w-48 h-48 md:w-64 md:h-64 object-contain"
                      animate={{ y: [0, -20, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  {transitionCharacter && (
                    <div className="w-16 h-4 bg-black/80 rounded-full"></div>
                  )}
                  <span className="text-8xl md:text-[12rem] font-black text-white font-display" style={{ WebkitTextStroke: '4px black', textShadow: '8px 8px 0 #000' }}>
                    {nextLevelIndex + 1}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image Container - Full Background */}
          {gameState !== 'start_bg_only' && gameState !== 'end_bg_only' && (
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-transparent p-8 md:p-24">
              <motion.div 
                ref={imageContainerRef} 
                className={`relative inline-block shadow-2xl transition-transform duration-300 overflow-hidden ${enableShineBorder ? 'ring-4 ring-black p-1' : ''}`}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  borderRadius: `${imageBorderRadius}px`
                }}
                animate={enableImageWobble && gameState === 'playing' ? {
                  scale: imageScale / 100,
                  rotate: [0, 1, -1, 0],
                  y: [0, -5, 5, 0]
                } : {
                  scale: imageScale / 100
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
              {enableShineBorder && (
                <>
                  <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#ffffff_100%)] z-0" />
                  <div className="absolute inset-[4px] bg-black z-0" style={{ borderRadius: `${Math.max(0, imageBorderRadius - 4)}px` }} />
                </>
              )}
              <div className="relative z-10">
                <img 
                  src={activeLevel.image!} 
                  className={`max-w-full max-h-full block ${gameState === 'playing' ? 'cursor-crosshair' : ''} ${((gameState === 'won' || (gameState === 'transition' && nextLevelIndex !== 0)) && activeLevel.video) || (gameState === 'intro' && activeLevel.introVideo) ? 'opacity-0' : ''}`} 
                  style={{ borderRadius: `${enableShineBorder ? Math.max(0, imageBorderRadius - 4) : imageBorderRadius}px` }}
                  onClick={handlePlayClick} 
                  draggable={false}
                />
                {enableDarkStart && gameState === 'playing' && darkStartProgress > 0 && (
                  <div 
                    className="absolute inset-0 bg-black pointer-events-none"
                    style={{ 
                      opacity: darkStartProgress,
                      borderRadius: `${enableShineBorder ? Math.max(0, imageBorderRadius - 4) : imageBorderRadius}px` 
                    }}
                  />
                )}
              </div>
              
              {gameState === 'intro' && activeLevel.introVideo && (
                <video
                  ref={(el) => {
                    if (el) {
                      el.play().catch(() => {
                        startPlayingAfterIntro();
                      });
                    }
                  }}
                  src={activeLevel.introVideo}
                  autoPlay
                  playsInline
                  onEnded={startPlayingAfterIntro}
                  onError={startPlayingAfterIntro}
                  className="absolute top-0 left-0 w-full h-full z-20"
                  style={{ objectFit: 'cover' }}
                />
              )}

              {(gameState === 'won' || (gameState === 'transition' && nextLevelIndex !== 0)) && activeLevel.video && (
                <video
                  ref={(el) => {
                    if (el && gameState === 'won') {
                      el.play().catch(() => {
                        scheduleTransition(0);
                      });
                    }
                  }}
                  src={activeLevel.video}
                  autoPlay
                  playsInline
                  onEnded={() => scheduleTransition(0)}
                  onError={() => scheduleTransition(0)}
                  className="absolute top-0 left-0 w-full h-full z-20"
                  style={{ objectFit: 'cover' }}
                />
              )}
              
              {/* Found Markers */}
              <AnimatePresence>
                {!((gameState === 'won' || gameState === 'transition') && activeLevel.video) && activeLevel.items.map(item => item.found && (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute rounded-full border-4 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] pointer-events-none flex items-center justify-center z-10 transform -translate-x-1/2 -translate-y-1/2"
                    style={{ 
                      left: `${item.x}%`, 
                      top: `${item.y}%`,
                      width: `${item.radius * 2}%`,
                      aspectRatio: '1 / 1'
                    }}
                  >
                    <CheckCircle className="text-emerald-400 drop-shadow-md" size={Math.max(16, (item.radius / 100) * (imageRect?.width || 800) * 0.5)} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Reward Animations */}
              <AnimatePresence>
                {activeRewards.map(reward => (
                  <div
                    key={reward.id}
                    className="absolute z-[60] pointer-events-none flex items-center justify-center"
                    style={{ left: `${reward.x}%`, top: `${reward.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.3 }}
                      animate={{ opacity: [0, 1, 1, 0], y: -80, scale: [0.3, 1.2, 1, 1] }}
                      transition={{ duration: 1.5, ease: "easeOut", times: [0, 0.2, 0.8, 1] }}
                      className="flex items-center gap-2"
                    >
                      {reward.isCheckpoint ? (
                        activeLevel.checkpointImage && (
                          <motion.img 
                            src={activeLevel.checkpointImage} 
                            className="w-32 h-32 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]" 
                            animate={{ rotateY: [0, 360], scale: [1, 1.5, 0] }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                          />
                        )
                      ) : (
                        <>
                          {rewardImage && (
                            <motion.img 
                              src={rewardImage} 
                              className="w-24 h-24 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]" 
                              animate={{ rotateY: [0, 360] }}
                              transition={{ duration: 1.5, ease: "linear" }}
                            />
                          )}
                          <span className="text-white font-black text-6xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]" style={{ WebkitTextStroke: '3px #F59E0B' }}>+1</span>
                        </>
                      )}
                    </motion.div>
                  </div>
                ))}
              </AnimatePresence>

              {/* Realistic Magnifying Glass Animation */}
              {gameState === 'revealing' && imageRect && (
                <motion.div
                  className="absolute z-50 pointer-events-none"
                  style={{ 
                    left: glassLeftStr,
                    top: glassTopStr,
                    width: 0, 
                    height: 0 
                  }}
                >
                  {/* The Lens Mask */}
                  <motion.div 
                    className="absolute rounded-full overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.85),0_15px_35px_rgba(0,0,0,0.6)] bg-black"
                    style={{
                      width: currentLensSize,
                      height: currentLensSize,
                      left: maskLeft,
                      top: maskTop,
                      border: glassImage ? 'none' : '6px solid #d1d5db'
                    }}
                  >
                    <motion.img
                      src={activeLevel.image!}
                      className="absolute max-w-none origin-top-left"
                      style={{
                        width: innerWidth,
                        height: innerHeight,
                        left: innerLeft,
                        top: innerTop,
                      }}
                    />
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] pointer-events-none" />
                    {/* Center dot for precision */}
                    <div className="absolute top-1/2 left-1/2 w-1 h-1 -ml-[0.5px] -mt-[0.5px] rounded-full bg-red-500/50 shadow-[0_0_5px_rgba(255,0,0,0.8)]" />
                  </motion.div>

                  {/* The Glass Frame / Uploaded Image */}
                  {glassImage ? (
                    <motion.img 
                      src={glassImage} 
                      className="absolute pointer-events-none drop-shadow-2xl max-w-none" 
                      style={{
                        width: customGlassWidth,
                        x: `-${glassCenter.x}%`,
                        y: `-${glassCenter.y}%`,
                        rotate: glassRotation,
                        transformOrigin: `${glassCenter.x}% ${glassCenter.y}%`
                      }}
                    />
                  ) : (
                    <motion.div 
                      className="absolute bg-gradient-to-br from-gray-700 to-gray-900 rounded-full shadow-2xl border-2 border-gray-600 pointer-events-none" 
                      style={{
                         width: defaultGlassWidth,
                         height: defaultGlassHeight,
                         left: defaultGlassLeft,
                         top: defaultGlassTop,
                         rotate: defaultGlassRotate,
                         transformOrigin: "0 0"
                      }}
                    />
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
          )}

          {/* Time's Up Overlay */}
          <AnimatePresence>
            {gameState === 'waiting_reveal' && enableTimesUp && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm"
              >
                <div className="flex gap-2 mb-4">
                  <Star className="text-yellow-400 fill-yellow-400 w-16 h-16 drop-shadow-lg" />
                  <Star className="text-yellow-400 fill-yellow-400 w-24 h-24 -mt-8 drop-shadow-lg" />
                  <Star className="text-yellow-400 fill-yellow-400 w-16 h-16 drop-shadow-lg" />
                </div>
                <h1 className="text-7xl md:text-9xl font-black text-white uppercase tracking-wider text-center" style={{
                  WebkitTextStroke: '4px #1e3a8a',
                  textShadow: '0 10px 20px rgba(0,0,0,0.5), 0 0 40px rgba(59,130,246,0.5)',
                  fontFamily: "'Fredoka One', 'Nunito', sans-serif"
                }}>
                  {timesUpText}
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Start/End BG Only Channel Name */}
          {(gameState === 'start_bg_only' || gameState === 'end_bg_only') && channelName && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none">
              <div className="flex items-center gap-2">
                <YoutubeLogo size={32} className="drop-shadow-md" />
                <span className="text-3xl md:text-5xl font-bold text-white/90 uppercase tracking-widest drop-shadow-md" style={enableChannelOutline ? { WebkitTextStroke: '1px black', textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 4px 4px 8px rgba(0,0,0,0.8)' } : {}}>
                  {channelName}
                </span>
              </div>
            </div>
          )}

          {/* Video Time Bars */}
          {((gameState === 'intro' && activeLevel.enableIntroVideoTimeBars) || ((gameState === 'won' || (gameState === 'transition' && nextLevelIndex !== 0)) && activeLevel.video && activeLevel.enableEndVideoTimeBars)) && videoTimeLeft !== null && videoTimeLeft > 0 && (
            <>
              {/* Left Bar (Blue) */}
              <div 
                data-ui-id="videoTimeBarLeft"
                className={`absolute left-4 top-32 bottom-20 w-16 md:w-20 flex justify-center z-40 transition-transform origin-center ${isEditMode ? 'cursor-move pointer-events-auto' : 'pointer-events-none'}`}
                style={{ transform: `translate(${uiPositions.videoTimeBarLeft.x}px, ${uiPositions.videoTimeBarLeft.y}px) scale(${uiPositions.videoTimeBarLeft.scale})`, touchAction: isEditMode ? 'none' : 'auto' }}
                onPointerDown={isEditMode ? (e) => handlePointerDown(e, 'videoTimeBarLeft', 'drag') : undefined}
              >
                <div className="relative w-full h-full bg-black/50 rounded-full border-[6px] border-white/80 shadow-xl overflow-hidden flex flex-col justify-end items-center">
                  <motion.div
                    className="w-full bg-blue-500"
                    initial={{ height: '100%' }}
                    animate={{ height: '0%' }}
                    transition={{ duration: gameState === 'intro' ? (activeLevel.introVideoTimeBarsDuration || 10) : (activeLevel.endVideoTimeBarsDuration || 10), ease: "linear" }}
                    style={{
                      backgroundImage: 'linear-gradient(-45deg, rgba(255,255,255,0.25) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 75%, transparent 75%, transparent)',
                      backgroundSize: '40px 40px',
                      boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.3)'
                    }}
                  />
                </div>
              </div>
              {/* Right Bar (Red) */}
              <div 
                data-ui-id="videoTimeBarRight"
                className={`absolute right-4 top-32 bottom-20 w-16 md:w-20 flex justify-center z-40 transition-transform origin-center ${isEditMode ? 'cursor-move pointer-events-auto' : 'pointer-events-none'}`}
                style={{ transform: `translate(${uiPositions.videoTimeBarRight.x}px, ${uiPositions.videoTimeBarRight.y}px) scale(${uiPositions.videoTimeBarRight.scale})`, touchAction: isEditMode ? 'none' : 'auto' }}
                onPointerDown={isEditMode ? (e) => handlePointerDown(e, 'videoTimeBarRight', 'drag') : undefined}
              >
                <div className="relative w-full h-full bg-black/50 rounded-full border-[6px] border-white/80 shadow-xl overflow-hidden flex flex-col justify-end items-center">
                  <motion.div
                    className="w-full bg-red-500"
                    initial={{ height: '100%' }}
                    animate={{ height: '0%' }}
                    transition={{ duration: gameState === 'intro' ? (activeLevel.introVideoTimeBarsDuration || 10) : (activeLevel.endVideoTimeBarsDuration || 10), ease: "linear" }}
                    style={{
                      backgroundImage: 'linear-gradient(-45deg, rgba(255,255,255,0.25) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 75%, transparent 75%, transparent)',
                      backgroundSize: '40px 40px',
                      boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.3)'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* UI Overlay */}
          {gameState !== 'start_bg_only' && gameState !== 'end_bg_only' && (
            <div className="relative z-20 flex flex-col h-full justify-between p-4 pointer-events-none">
              {/* Top Bar */}
            <div className="flex justify-between items-start w-full relative">
              {/* Left: Fase */}
              <div 
                data-ui-id="levelCounter"
                className={`z-20 transition-transform origin-top-left ${isEditMode ? 'cursor-move' : ''}`} 
                style={{ transform: `translate(${levelCounterPosition.x + uiPositions.levelCounter.x}px, ${levelCounterPosition.y + uiPositions.levelCounter.y}px) scale(${uiPositions.levelCounter.scale})`, touchAction: isEditMode ? 'none' : 'auto' }}
                onPointerDown={isEditMode ? (e) => handlePointerDown(e, 'levelCounter', 'drag') : undefined}
              >
                {isEditMode && <div className="absolute inset-0 border-2 border-dashed border-indigo-400 bg-indigo-400/20 pointer-events-none rounded-xl" />}
                <HandMagnifier phase={activeLevelIndex + 1} image={levelCounterImage} offset={levelCounterOffset} size={levelCounterSize} numberSize={levelCounterNumberSize} />
                {isEditMode && (
                  <div 
                    className="absolute -bottom-3 -right-3 w-8 h-8 bg-indigo-500 rounded-full border-2 border-white cursor-se-resize flex items-center justify-center shadow-lg z-50 pointer-events-auto"
                    onPointerDown={(e) => handlePointerDown(e, 'levelCounter', 'resize')}
                  >
                    <Maximize2 size={14} className="text-white pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Center: Title */}
              <div className="absolute inset-x-0 top-0 h-20 md:h-24 flex items-center justify-center pointer-events-none z-10">
                <h1 className="text-2xl md:text-4xl font-black text-white text-center uppercase tracking-wider font-sans drop-shadow-2xl" style={{ WebkitTextStroke: '1px black', textShadow: '2px 2px 0 #000, 4px 4px 10px rgba(0,0,0,0.5)' }}>
                  {activeLevel.title}
                </h1>
              </div>

              {/* Right: Channel Icon */}
              <div 
                data-ui-id="channelIcon"
                className={`w-20 h-20 md:w-24 md:h-24 shrink-0 overflow-visible relative pointer-events-auto cursor-pointer drop-shadow-xl z-20 transition-transform origin-top-right ${isEditMode ? 'cursor-move' : ''}`}
                style={{ 
                  marginRight: timeBarOrientation === 'vertical' ? '0' : '0',
                  transform: `translate(${uiPositions.channelIcon.x}px, ${uiPositions.channelIcon.y}px) scale(${uiPositions.channelIcon.scale})`,
                  touchAction: isEditMode ? 'none' : 'auto'
                }}
                onClick={!isEditMode ? () => setShowGameplayMenu(!showGameplayMenu) : undefined}
                onPointerDown={isEditMode ? (e) => handlePointerDown(e, 'channelIcon', 'drag') : undefined}
              >
                {isEditMode && <div className="absolute inset-0 border-2 border-dashed border-indigo-400 bg-indigo-400/20 pointer-events-none rounded-full" />}
                <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center ${channelIcon ? '' : 'bg-amber-500 border-4 border-amber-700'}`}>
                  {channelIcon ? (
                    <motion.img 
                      src={channelIcon} 
                      className="w-full h-full object-cover"
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-xs text-center">MENU</span>
                  )}
                </div>
                {isEditMode && (
                  <div 
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-500 rounded-full border-2 border-white cursor-se-resize flex items-center justify-center shadow-lg z-50 pointer-events-auto"
                    onPointerDown={(e) => handlePointerDown(e, 'channelIcon', 'resize')}
                  >
                    <Maximize2 size={14} className="text-white pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Sidebar & Vertical Time Bar */}
            <div className="flex-1 flex justify-between items-stretch mt-4 pointer-events-none z-30">
              {/* Left side empty for balance or future use */}
              <div className="w-8"></div>
              
              {/* Right: Vertical Time Bar */}
              {timeBarOrientation === 'vertical' && (
                <div 
                  data-ui-id="timeBar"
                  className={`absolute right-4 top-32 bottom-20 w-20 md:w-24 flex justify-center origin-center transition-transform ${isEditMode ? 'cursor-move pointer-events-auto z-50' : 'pointer-events-none z-30'}`}
                  style={{ transform: `translate(${uiPositions.timeBar.x}px, ${uiPositions.timeBar.y}px) scale(${uiPositions.timeBar.scale})`, touchAction: isEditMode ? 'none' : 'auto' }}
                  onPointerDown={isEditMode ? (e) => handlePointerDown(e, 'timeBar', 'drag') : undefined}
                >
                  {isEditMode && <div className="absolute inset-0 border-2 border-dashed border-indigo-400 bg-indigo-400/20 pointer-events-none rounded-xl z-50" />}
                  <AnimatePresence>
                    {gameState === 'playing' && (
                      <motion.div 
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        exit={{ scaleY: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="absolute inset-0 flex justify-center"
                      >
                        <TimeBar timeLeft={timeLeft} timeLimit={Number(timeLimit) || 60} orientation="vertical" trackerImage={timeBarTrackerImage} trackerImageSize={trackerImageSize} checkpoints={activeLevel.enableCheckpoints ? { count: activeLevel.checkpointCount || 0, image: activeLevel.checkpointImage || null } : undefined} hitCheckpoints={hitCheckpoints} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {channelName && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                      <div className="flex items-center gap-2 transform -rotate-90 whitespace-nowrap">
                        <YoutubeLogo size={24} className="drop-shadow-md" />
                        <span className="text-xl md:text-2xl font-bold text-white/90 uppercase tracking-widest drop-shadow-md" style={enableChannelOutline ? { WebkitTextStroke: '0.5px black', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8)' } : {}}>
                          {channelName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Items List */}
            <div 
              data-ui-id="itemsList"
              className={`absolute z-30 transition-transform ${timeBarOrientation === 'horizontal' ? 'right-4 top-32 bottom-20 w-24 flex-col origin-right' : 'bottom-24 left-0 right-0 h-24 flex-row justify-center origin-bottom'} flex items-center gap-6 ${isEditMode ? 'cursor-move pointer-events-auto' : 'pointer-events-none'}`} 
              style={{ transform: `translate(${uiPositions.itemsList.x}px, ${uiPositions.itemsList.y}px) scale(${uiPositions.itemsList.scale})`, touchAction: isEditMode ? 'none' : 'auto' }}
              onPointerDown={isEditMode ? (e) => handlePointerDown(e, 'itemsList', 'drag') : undefined}
            >
              {isEditMode && <div className="absolute inset-0 border-2 border-dashed border-indigo-400 bg-indigo-400/20 pointer-events-none rounded-3xl z-50" />}
              <AnimatePresence>
                {showList && activeLevel.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: item.found ? 0.3 : 1, 
                      scale: item.found ? 0.8 : 1,
                      y: item.found ? 0 : [0, -8, 0]
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ 
                      y: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 },
                      opacity: { duration: 0.3 },
                      scale: { duration: 0.3 }
                    }}
                    className="relative w-20 h-20 shrink-0"
                  >
                    {item.imageCrop ? (
                      <img src={item.imageCrop} alt={item.name} className={`w-full h-full object-contain drop-shadow-2xl ${item.found ? 'grayscale' : ''}`} style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }} />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white text-xs text-center p-2 font-bold ${item.found ? 'grayscale' : ''}`}>
                        {item.name}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isEditMode && (
                <div 
                  className="absolute -bottom-3 -right-3 w-8 h-8 bg-indigo-500 rounded-full border-2 border-white cursor-se-resize flex items-center justify-center shadow-lg z-50 pointer-events-auto"
                  onPointerDown={(e) => handlePointerDown(e, 'itemsList', 'resize')}
                >
                  <Maximize2 size={14} className="text-white pointer-events-none" />
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="w-full flex flex-col items-center justify-end pb-2 pointer-events-none z-20 gap-4 mt-4 px-4">
              {/* Horizontal Time Bar */}
              {timeBarOrientation === 'horizontal' && (
                <div 
                  data-ui-id="timeBar"
                  className={`w-full origin-center relative max-w-4xl mx-auto h-12 md:h-16 flex items-center justify-center transition-transform ${isEditMode ? 'cursor-move pointer-events-auto z-50' : ''}`}
                  style={{ transform: `translate(${uiPositions.timeBar.x}px, ${uiPositions.timeBar.y}px) scale(${uiPositions.timeBar.scale})`, touchAction: isEditMode ? 'none' : 'auto' }}
                  onPointerDown={isEditMode ? (e) => handlePointerDown(e, 'timeBar', 'drag') : undefined}
                >
                  {isEditMode && <div className="absolute inset-0 border-2 border-dashed border-indigo-400 bg-indigo-400/20 pointer-events-none rounded-xl z-50" />}
                  <AnimatePresence>
                    {gameState === 'playing' && (
                      <motion.div 
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        exit={{ scaleX: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <TimeBar timeLeft={timeLeft} timeLimit={Number(timeLimit) || 60} orientation="horizontal" trackerImage={timeBarTrackerImage} trackerImageSize={trackerImageSize} checkpoints={activeLevel.enableCheckpoints ? { count: activeLevel.checkpointCount || 0, image: activeLevel.checkpointImage || null } : undefined} hitCheckpoints={hitCheckpoints} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {channelName && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                      <div className="flex items-center gap-2">
                        <YoutubeLogo size={24} className="drop-shadow-md" />
                        <span className="text-xl md:text-2xl font-bold text-white/90 uppercase tracking-widest drop-shadow-md" style={enableChannelOutline ? { WebkitTextStroke: '0.5px black', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8)' } : {}}>
                          {channelName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Edit Mode Overlay */}
          {isEditMode && (
            <div className="absolute inset-0 z-[90] pointer-events-none overflow-hidden">
              {/* Grid */}
              <div className="absolute inset-0 opacity-50" style={{
                backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }} />
              
              {/* Snap Lines */}
              {snapLines.x !== null && (
                <div className="fixed top-0 bottom-0 w-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] z-[100]" style={{ left: snapLines.x }} />
              )}
              {snapLines.y !== null && (
                <div className="fixed left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] z-[100]" style={{ top: snapLines.y }} />
              )}

              {/* Toolbar */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 shadow-2xl flex items-center gap-6 z-[100] pointer-events-auto">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Crosshair size={20} className="text-indigo-400" />
                  {t.editMode}
                </div>
                <div className="w-px h-6 bg-white/20" />
                <button 
                  onClick={() => setUiPositions(defaultUIPositions)}
                  className="text-sm font-medium text-white/70 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <RotateCcw size={16} />
                  Resetar
                </button>
                <button 
                  onClick={() => setIsEditMode(false)}
                  className="text-sm font-bold bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-full transition-colors"
                >
                  Concluir (A)
                </button>
              </div>
            </div>
          )}

          {/* Gameplay Menu Overlay */}
          <AnimatePresence>
            {showGameplayMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="absolute top-28 right-4 bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-2xl z-50 flex flex-col gap-2 w-64"
              >
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
                  <span className="font-bold text-white">Menu</span>
                  <button onClick={() => setShowGameplayMenu(false)} className="text-white/50 hover:text-white"><Trash2 size={16} className="hidden" /> <X size={24} /></button>
                </div>
                
                <div className="flex gap-2 bg-black/30 p-1 rounded-lg border border-white/10 mb-2">
                  {(['pt', 'en', 'es'] as Lang[]).map(l => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${lang === l ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button onClick={() => setSoundEnabled(!soundEnabled)} className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  {soundEnabled ? 'Som Ligado' : 'Som Desligado'}
                </button>

                <button onClick={() => setShowList(!showList)} className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
                  {showList ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showList ? t.hideList : t.showList}
                </button>

                {gameState === 'playing' && (
                  <button onClick={() => { startReveal(); setShowGameplayMenu(false); }} className="flex items-center gap-3 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-xl text-sm font-medium transition-colors">
                    <Search size={16} />
                    {t.reveal}
                  </button>
                )}

                <button onClick={toggleFullscreen} className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  {isFullscreen ? t.exitFullscreen : t.fullscreen}
                </button>

                <button onClick={() => { setIsEditMode(true); setShowGameplayMenu(false); }} className="flex items-center gap-3 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-xl text-sm font-medium transition-colors">
                  <Crosshair size={16} />
                  {t.editMode} (A)
                </button>

                <button onClick={() => { resetGame(); setShowGameplayMenu(false); }} className="flex items-center gap-3 px-3 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl text-sm font-medium transition-colors mt-2">
                  <RotateCcw size={16} />
                  {t.backToSetup}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </motion.div>
    </>
  );
}

