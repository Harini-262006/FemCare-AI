import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  User,
  Stethoscope,
  Check,
  Award,
  Users,
  Flower2,
  Sparkles,
  Clock,
  Eye,
  MessageSquareHeart,
  Baby,
  Leaf,
  Dumbbell,
  Brain,
  Droplets,
  Moon,
  Send,
  Search,
  TrendingUp,
} from 'lucide-react'
import BackToHomeButton from '@/components/BackToHomeButton'

type Category =
  | 'All Discussions'
  | 'Pregnancy & Motherhood'
  | 'PCOS & Hormones'
  | 'New Moms'
  | 'Nutrition & Diet'
  | 'Fitness & Exercise'
  | 'Mental Health'
  | 'TTC & Fertility'

interface Post {
  id: string
  author: string
  anonymous: boolean
  category: Category
  title: string
  content: string
  timestamp: string
  likes: number
  comments: number
  doctorVerified: boolean
  avatarColor: string
}

interface Contributor {
  id: string
  name: string
  posts: number
  avatarColor: string
  badge?: string
}

interface DoctorTip {
  id: string
  title: string
  content: string
  category: string
  icon: React.ReactNode
}

const CATEGORIES: Category[] = [
  'All Discussions',
  'Pregnancy & Motherhood',
  'PCOS & Hormones',
  'New Moms',
  'Nutrition & Diet',
  'Fitness & Exercise',
  'Mental Health',
  'TTC & Fertility',
]

const CATEGORY_COLORS: Record<string, string> = {
  'All Discussions': 'from-gray-100 to-gray-50 text-gray-700 border-gray-200',
  'Pregnancy & Motherhood': 'from-pink-100 to-rose-50 text-pink-700 border-pink-200',
  'PCOS & Hormones': 'from-purple-100 to-fuchsia-50 text-purple-700 border-purple-200',
  'New Moms': 'from-amber-100 to-yellow-50 text-amber-700 border-amber-200',
  'Nutrition & Diet': 'from-emerald-100 to-teal-50 text-emerald-700 border-emerald-200',
  'Fitness & Exercise': 'from-cyan-100 to-sky-50 text-cyan-700 border-cyan-200',
  'Mental Health': 'from-indigo-100 to-violet-50 text-indigo-700 border-indigo-200',
  'TTC & Fertility': 'from-rose-100 to-pink-50 text-rose-700 border-rose-200',
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'All Discussions': <MessageSquareHeart className="w-3.5 h-3.5" />,
  'Pregnancy & Motherhood': <Baby className="w-3.5 h-3.5" />,
  'PCOS & Hormones': <Droplets className="w-3.5 h-3.5" />,
  'New Moms': <Flower2 className="w-3.5 h-3.5" />,
  'Nutrition & Diet': <Leaf className="w-3.5 h-3.5" />,
  'Fitness & Exercise': <Dumbbell className="w-3.5 h-3.5" />,
  'Mental Health': <Brain className="w-3.5 h-3.5" />,
  'TTC & Fertility': <Heart className="w-3.5 h-3.5" />,
}

const AVATAR_GRADIENTS = [
  'from-pink-400 to-rose-500',
  'from-purple-400 to-fuchsia-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-cyan-400 to-sky-500',
  'from-indigo-400 to-violet-500',
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
]

const SEED_POSTS: Post[] = [
  {
    id: 'p1',
    author: 'Priya Sharma',
    anonymous: false,
    category: 'Pregnancy & Motherhood',
    title: 'First trimester nausea remedies that actually worked for me',
    content: 'Hi everyone! I\'m 11 weeks and have been struggling with morning sickness. Wanted to share what helped: ginger candies, small frequent meals, acupressure wrist bands, and staying hydrated with electrolyte water. Would love to hear what worked for you too! 💕',
    timestamp: '2 hours ago',
    likes: 147,
    comments: 32,
    doctorVerified: true,
    avatarColor: AVATAR_GRADIENTS[0],
  },
  {
    id: 'p2',
    author: 'Anonymous User',
    anonymous: true,
    category: 'PCOS & Hormones',
    title: 'Just got diagnosed with PCOS at 24 - feeling overwhelmed',
    content: 'Got my ultrasound results back today. My gynecologist confirmed PCOS. I\'m scared about fertility and all the symptoms - acne, weight gain, irregular periods. Anyone else been here? How did you cope initially? Any lifestyle changes that made a real difference?',
    timestamp: '4 hours ago',
    likes: 289,
    comments: 76,
    doctorVerified: true,
    avatarColor: AVATAR_GRADIENTS[1],
  },
  {
    id: 'p3',
    author: 'Meera Patel',
    anonymous: false,
    category: 'New Moms',
    title: 'Surviving the 4th trimester - my honest experience at 6 weeks postpartum',
    content: 'Nobody talks about how hard the first 6 weeks really are. The sleep deprivation is real, my body feels foreign, and I cry at everything. But I\'m also falling more in love every day. Tips for other new moms: accept ALL help, don\'t try to "bounce back", and be gentle with yourself.',
    timestamp: '6 hours ago',
    likes: 523,
    comments: 98,
    doctorVerified: false,
    avatarColor: AVATAR_GRADIENTS[2],
  },
  {
    id: 'p4',
    author: 'Ananya Reddy',
    anonymous: false,
    category: 'Nutrition & Diet',
    title: 'Iron-rich vegetarian meals that aren\'t boring - sharing my 1-week meal plan!',
    content: 'As someone with chronic iron deficiency, I spent months researching and testing meals that actually boost absorption. Vitamin C + iron is KEY! Sharing my go-to meals: spinach & citrus smoothies, lentil bowls with bell peppers, pumpkin seeds trail mix, tofu stir fry with broccoli. Pair iron sources with vitamin C!',
    timestamp: '8 hours ago',
    likes: 312,
    comments: 45,
    doctorVerified: true,
    avatarColor: AVATAR_GRADIENTS[3],
  },
  {
    id: 'p5',
    author: 'Anonymous User',
    anonymous: true,
    category: 'Mental Health',
    title: 'Anxiety around my period every month - is this PMDD?',
    content: 'For the past year, 7-10 days before my period I become a different person. Irritable, anxious, can\'t sleep, feel hopeless. Then the day my period starts, it\'s like a switch flips. Has anyone been diagnosed with PMDD? What was the process like and what treatments helped?',
    timestamp: '10 hours ago',
    likes: 421,
    comments: 134,
    doctorVerified: true,
    avatarColor: AVATAR_GRADIENTS[4],
  },
  {
    id: 'p6',
    author: 'Kavya Menon',
    anonymous: false,
    category: 'Fitness & Exercise',
    title: 'Low-impact workout routine for PCOS weight management (no equipment!)',
    content: 'After 6 months of consistency, I want to share what worked for my PCOS body. 30 min walks daily, 20 min yoga 3x/week, resistance band glute bridges, swimming when possible. Focus on movement you enjoy, not punishment. Lost 8kg naturally and my cycles are regular now!',
    timestamp: '12 hours ago',
    likes: 678,
    comments: 112,
    doctorVerified: true,
    avatarColor: AVATAR_GRADIENTS[5],
  },
  {
    id: 'p7',
    author: 'Sneha Krishnan',
    anonymous: false,
    category: 'TTC & Fertility',
    title: 'TTC for 18 months - finally got my BFP! Sharing what I learned',
    content: 'After tracking ovulation, 3 IUI attempts, and countless negative tests, I\'m 5 weeks pregnant! Things that made a difference: accurate ovulation tracking (temp + OPK), CoQ10 supplements, cutting back on caffeine, acupuncture, and prioritizing sleep. Never lose hope! ✨',
    timestamp: '1 day ago',
    likes: 892,
    comments: 203,
    doctorVerified: false,
    avatarColor: AVATAR_GRADIENTS[6],
  },
  {
    id: 'p8',
    author: 'Anonymous User',
    anonymous: true,
    category: 'New Moms',
    title: 'Breastfeeding journey - from struggling to thriving at 3 months',
    content: 'The first 4 weeks were torture. Cracked nipples, baby not latching, crying every feed. Saw a lactation consultant, used nipple shields temporarily, and power pumped to build supply. Now at 12 weeks, we\'re a team! If you\'re struggling now, it does get better. Don\'t quit before the miracle.',
    timestamp: '1 day ago',
    likes: 445,
    comments: 87,
    doctorVerified: true,
    avatarColor: AVATAR_GRADIENTS[7],
  },
  {
    id: 'p9',
    author: 'Riya Kapoor',
    anonymous: false,
    category: 'PCOS & Hormones',
    title: 'Inositol supplement experience after 3 months',
    content: 'Started taking Myo-Inositol 4g daily per my endocrinologist. Results: skin cleared up significantly, periods became more regular (32-35 day cycle vs 45-60!), and I have more energy. Worth discussing with your doctor if you have PCOS. Everyone responds differently though!',
    timestamp: '2 days ago',
    likes: 267,
    comments: 54,
    doctorVerified: true,
    avatarColor: AVATAR_GRADIENTS[0],
  },
]

const TOP_CONTRIBUTORS: Contributor[] = [
  { id: 'c1', name: 'Dr. Anjali Desai', posts: 187, avatarColor: AVATAR_GRADIENTS[0], badge: 'Top Helper' },
  { id: 'c2', name: 'Priya Sharma', posts: 142, avatarColor: AVATAR_GRADIENTS[1], badge: 'Top Helper' },
  { id: 'c3', name: 'Meera Patel', posts: 128, avatarColor: AVATAR_GRADIENTS[2] },
  { id: 'c4', name: 'Kavya Menon', posts: 115, avatarColor: AVATAR_GRADIENTS[3], badge: 'Top Helper' },
  { id: 'c5', name: 'Ananya Reddy', posts: 103, avatarColor: AVATAR_GRADIENTS[4] },
]

const DOCTOR_TIPS: DoctorTip[] = [
  {
    id: 't1',
    title: 'PCOS Management Essentials',
    content: 'Focus on protein-rich meals, limit processed sugars, and incorporate 30 min of daily movement. Inositol supplementation may help improve insulin sensitivity — consult your doctor first.',
    category: 'PCOS & Hormones',
    icon: <Droplets className="w-5 h-5" />,
  },
  {
    id: 't2',
    title: 'First Trimester Wellness',
    content: 'Stay hydrated with small sips throughout the day. Take folic acid 400mcg daily. Avoid raw/unpasteurized foods. Rest when you need to — growing a human is hard work!',
    category: 'Pregnancy & Motherhood',
    icon: <Baby className="w-5 h-5" />,
  },
  {
    id: 't3',
    title: 'Mental Health Check-In',
    content: 'It\'s okay to not feel okay. Hormonal fluctuations, life changes, and societal pressure can impact mental wellbeing. Reach out to a therapist — there is no shame in getting support.',
    category: 'Mental Health',
    icon: <Brain className="w-5 h-5" />,
  },
  {
    id: 't4',
    title: 'Nutrition for Hormonal Balance',
    content: 'Include healthy fats (avocado, nuts, olive oil) with every meal. Add cruciferous veggies for liver detox. Limit refined carbs and sugary drinks. Pair iron-rich foods with vitamin C for better absorption.',
    category: 'Nutrition & Diet',
    icon: <Leaf className="w-5 h-5" />,
  },
]

const getInitials = (name: string) => {
  if (name === 'Anonymous User') return 'A'
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

export default function CommunitySupport() {
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS)
  const [activeCategory, setActiveCategory] = useState<Category>('All Discussions')
  const [showModal, setShowModal] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const [newPostAnonymous, setNewPostAnonymous] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostCategory, setNewPostCategory] = useState<Category>('Mental Health')
  const [newPostContent, setNewPostContent] = useState('')

  const filteredPosts = useMemo(() => {
    let result = posts
    if (activeCategory !== 'All Discussions') {
      result = result.filter((p) => p.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q)
      )
    }
    return result
  }, [posts, activeCategory, searchQuery])

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: likedPosts.has(postId) ? p.likes - 1 : p.likes + 1 }
          : p
      )
    )
    setLikedPosts((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }

  const handleComment = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
    )
  }

  const handleSave = (postId: string) => {
    setSavedPosts((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }

  const handleSubmitPost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return
    const newPost: Post = {
      id: Date.now().toString(),
      author: newPostAnonymous ? 'Anonymous User' : 'You',
      anonymous: newPostAnonymous,
      category: newPostCategory,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      timestamp: 'Just now',
      likes: 0,
      comments: 0,
      doctorVerified: false,
      avatarColor: newPostAnonymous ? AVATAR_GRADIENTS[1] : AVATAR_GRADIENTS[5],
    }
    setPosts((prev) => [newPost, ...prev])
    setNewPostAnonymous(false)
    setNewPostTitle('')
    setNewPostCategory('Mental Health')
    setNewPostContent('')
    setShowModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-3xl -z-10 -translate-x-1/3 -translate-y-1/3 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-200/25 rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3 animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-teal-200/20 rounded-full blur-3xl -z-10 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '12s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerContainer}
          className="relative"
        >
          <div className="mb-6">
            <motion.div variants={fadeUp}>
              <BackToHomeButton />
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            className="relative mb-8 rounded-3xl p-8 sm:p-10 lg:p-12 bg-gradient-to-br from-pink-500 via-rose-400 to-purple-500 shadow-2xl shadow-pink-300/40 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mt-24 -mr-24" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl -mb-20 -ml-20" />
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [-10, -30, -10],
                  x: [0, 5, 0],
                  rotate: [0, 10, -10, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: 'easeInOut',
                }}
                className="absolute text-3xl pointer-events-none"
                style={{
                  top: `${15 + i * 10}%`,
                  left: `${60 + i * 5}%`,
                }}
              >
                {['🌸', '✨', '💕', '🌺', '💫', '🌷'][i]}
              </motion.div>
            ))}

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white/90 mb-5 border border-white/20">
                <Users className="w-4 h-4" />
                Join 50,000+ Women
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight">
                <span className="bg-gradient-to-r from-white via-pink-50 to-purple-100 bg-clip-text text-transparent drop-shadow-sm">
                  Women&apos;s Support
                </span>
                <br />
                <span className="bg-gradient-to-r from-yellow-100 via-pink-50 to-purple-100 bg-clip-text text-transparent">
                  Community
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-white/90 text-base sm:text-lg">
                <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
                  <ShieldCheck className="w-4.5 h-4.5" /> Safe space
                </span>
                <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
                  <EyeOff className="w-4.5 h-4.5" /> Anonymous
                </span>
                <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
                  <Stethoscope className="w-4.5 h-4.5" /> Doctor Verified
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-5">
              <div className="relative flex-1 max-w-md">
                <Search className="w-5 h-5 text-gray-400 absolute left-5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search discussions..."
                  className="w-full pl-14 pr-5 py-4 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white shadow-lg shadow-gray-100/50 text-gray-700 placeholder-gray-400 font-medium transition-all"
                />
              </div>
              <div className="flex items-center gap-3 ml-auto text-sm text-gray-500">
                <TrendingUp className="w-4 h-4 text-pink-500" />
                <span className="font-bold">{posts.length} discussions · </span>
                <span>Active community</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat
                const colorClass = CATEGORY_COLORS[cat] || CATEGORY_COLORS['All Discussions']
                const icon = CATEGORY_ICONS[cat]
                return (
                  <motion.button
                    key={cat}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveCategory(cat)}
                    className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-sm border transition-all shadow-sm ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent shadow-xl shadow-pink-200/50'
                        : `bg-gradient-to-br ${colorClass} hover:shadow-md`
                    }`}
                  >
                    {icon}
                    <span>{cat}</span>
                    {cat !== 'All Discussions' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20' : 'bg-white/60'
                      }`}>
                        {posts.filter((p) => p.category === cat).length}
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-200/50">
                <Stethoscope className="w-5.5 h-5.5" />
              </div>
              <div>
                <h2 className="text-2xl font-black bg-gradient-to-r from-gray-800 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Doctor Verified Tips
                </h2>
                <p className="text-sm text-gray-500">Curated insights from certified medical professionals</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {DOCTOR_TIPS.map((tip, i) => (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i }}
                  whileHover={{ y: -5, scale: 1.01 }}
                  className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-gray-100/50 border border-white hover:shadow-2xl hover:shadow-teal-100/50 transition-all overflow-hidden group"
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full opacity-50 blur-2xl group-hover:opacity-70 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-200/50">
                        {tip.icon}
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 text-[10px] font-black text-teal-700 uppercase tracking-wider">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    </div>
                    <h3 className="font-black text-gray-800 text-lg mb-2 leading-tight">{tip.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{tip.content}</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
                      <Stethoscope className="w-3 h-3 text-gray-500" />
                      <span className="text-[11px] font-bold text-gray-500">{tip.category}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {filteredPosts.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-100/50 border border-white p-12 sm:p-16 text-center"
                  >
                    <div className="relative w-40 h-40 mx-auto mb-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-3xl border-2 border-dashed border-pink-200"
                      />
                      <div className="absolute inset-6 rounded-3xl bg-gradient-to-br from-pink-100 via-purple-50 to-teal-50 flex items-center justify-center shadow-inner">
                        <MessageSquareHeart className="w-16 h-16 text-pink-400" />
                      </div>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
                      No discussions yet
                    </h2>
                    <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed text-base">
                      Be the first to start a conversation in this category! Your story could help someone else going through the same journey.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-pink-200/50 hover:shadow-2xl transition-shadow"
                    >
                      <Plus className="w-6 h-6" />
                      Start a Discussion
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="feed"
                    initial="hidden"
                    animate="show"
                    variants={staggerContainer}
                    className="space-y-5"
                  >
                    {filteredPosts.map((post) => (
                      <motion.article
                        key={post.id}
                        variants={fadeUp}
                        whileHover={{ y: -4, scale: 1.003 }}
                        className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-xl shadow-gray-100/50 border border-white hover:shadow-2xl hover:shadow-pink-100/40 transition-all overflow-hidden group"
                      >
                        <div className="absolute -top-20 -right-20 w-56 h-56 bg-gradient-to-br from-pink-50 to-purple-50 rounded-full opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500" />
                        <div className="relative">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="relative flex-shrink-0">
                              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${post.avatarColor} flex items-center justify-center text-white font-black text-sm shadow-lg shadow-gray-200/50`}>
                                {post.anonymous ? <User className="w-5 h-5" /> : getInitials(post.author)}
                              </div>
                              {post.anonymous && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                                  <EyeOff className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="font-bold text-gray-800 text-base">
                                  {post.author}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border bg-gradient-to-br ${CATEGORY_COLORS[post.category] || ''}`}>
                                  {CATEGORY_ICONS[post.category]}
                                  {post.category}
                                </span>
                                {post.doctorVerified && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 text-[10px] font-black text-teal-700 uppercase tracking-wider">
                                    <Stethoscope className="w-3 h-3" />
                                    Verified
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="font-medium">{post.timestamp}</span>
                              </div>
                            </div>
                          </div>

                          <h3 className="font-black text-gray-800 text-xl sm:text-2xl mb-3 leading-tight group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                            {post.title}
                          </h3>

                          <p className="text-gray-600 leading-relaxed text-sm sm:text-base mb-5 line-clamp-3">
                            {post.content}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleLike(post.id)}
                                className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl font-bold text-sm transition-all ${
                                  likedPosts.has(post.id)
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200/50'
                                    : 'bg-gray-50 text-gray-600 hover:bg-pink-50 hover:text-pink-600 border border-gray-100'
                                }`}
                              >
                                <Heart className={`w-4.5 h-4.5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                                <span>{post.likes}</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleComment(post.id)}
                                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl font-bold text-sm bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-purple-600 border border-gray-100 transition-all"
                              >
                                <MessageCircle className="w-4.5 h-4.5" />
                                <span>{post.comments}</span>
                              </motion.button>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2.5 rounded-2xl bg-gray-50 text-gray-500 hover:bg-teal-50 hover:text-teal-600 border border-gray-100 transition-all"
                                title="Share"
                              >
                                <Share2 className="w-4.5 h-4.5" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleSave(post.id)}
                                className={`p-2.5 rounded-2xl border transition-all ${
                                  savedPosts.has(post.id)
                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-white border-transparent shadow-lg shadow-amber-200/50'
                                    : 'bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600 border-gray-100'
                                }`}
                                title={savedPosts.has(post.id) ? 'Saved' : 'Save'}
                              >
                                <Bookmark className={`w-4.5 h-4.5 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-1">
              <motion.div variants={fadeUp} className="lg:sticky lg:top-6 space-y-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-gray-100/50 border border-white overflow-hidden relative">
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-60" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-200/50">
                        <Award className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black bg-gradient-to-r from-gray-800 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                          Top Contributors
                        </h3>
                        <p className="text-xs text-gray-500">This week&apos;s most helpful members</p>
                      </div>
                    </div>
                    <div className="space-y-3.5">
                      {TOP_CONTRIBUTORS.map((c, i) => (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * i }}
                          whileHover={{ x: 4, scale: 1.01 }}
                          className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-gray-50/50 to-white hover:from-amber-50/50 hover:to-pink-50/50 border border-transparent hover:border-amber-100 transition-all group"
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 group-hover:border-amber-200 transition-colors flex items-center justify-center text-gray-500 font-black text-sm">
                              {i === 0 && (
                                <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 text-white flex items-center justify-center text-[11px] font-black shadow-lg border-2 border-white">
                                  🏆
                                </span>
                              )}
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.avatarColor} flex items-center justify-center text-white text-xs font-black shadow-md`}>
                                {getInitials(c.name)}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-gray-800 text-sm truncate">{c.name}</span>
                              {c.badge && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-[9px] font-black text-amber-700 uppercase tracking-wider flex-shrink-0">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  {c.badge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <MessageSquareHeart className="w-3 h-3" />
                              <span className="font-bold text-gray-600">{c.posts}</span>
                              <span>posts</span>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-400 font-black text-xs group-hover:from-amber-100 group-hover:to-orange-100 group-hover:text-amber-600 transition-all">
                            #{i + 1}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-3xl p-6 shadow-2xl shadow-purple-300/40 overflow-hidden relative">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-300/20 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white mb-4 border border-white/20">
                      <Moon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 leading-tight">
                      Feeling alone?
                    </h3>
                    <p className="text-white/85 text-sm mb-5 leading-relaxed">
                      Talk anonymously with certified counselors 24/7. Your journey matters, and we&apos;re here to listen.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-3.5 bg-white text-pink-600 rounded-2xl font-black shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <Heart className="w-5 h-5" />
                      Chat with Counselor
                    </motion.button>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-gray-100/50 border border-white">
                  <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider mb-4 text-center text-gray-500">
                    Community Guidelines
                  </h3>
                  <ul className="space-y-3 text-sm">
                    {[
                      { icon: <Heart className="w-4 h-4 text-pink-500" />, text: 'Be kind and supportive always' },
                      { icon: <EyeOff className="w-4 h-4 text-purple-500" />, text: 'Respect everyone\'s privacy' },
                      { icon: <Stethoscope className="w-4 h-4 text-teal-500" />, text: 'Not a substitute for medical advice' },
                      { icon: <Check className="w-4 h-4 text-emerald-500" />, text: 'Share, don\'t judge' },
                    ].map((g, i) => (
                      <li key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {g.icon}
                        </div>
                        <span className="text-gray-700 leading-snug font-medium">{g.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30 w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 text-white shadow-2xl shadow-pink-400/50 flex items-center justify-center group"
      >
        <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s' }} />
        <Plus className="w-8 h-8 sm:w-9 sm:h-9 relative z-10" strokeWidth={2.5} />
        <span className="absolute right-full mr-3 px-3 py-2 rounded-xl bg-gray-900 text-white text-xs font-black whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all shadow-xl pointer-events-none">
          New Post
        </span>
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-40 bg-gradient-to-br from-pink-900/50 via-purple-900/50 to-indigo-900/50 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-full sm:max-w-xl max-h-[100vh] sm:max-h-[90vh] z-50 flex flex-col bg-white sm:rounded-3xl sm:shadow-2xl"
            >
              <div className="relative flex-shrink-0 px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-gray-50 bg-gradient-to-r from-pink-50 via-white to-purple-50 sm:rounded-t-3xl">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[11px] font-black uppercase tracking-wider mb-3">
                      <Sparkles className="w-3.5 h-3.5" />
                      Share Your Story
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                      Start a Discussion
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Your voice could help someone in our community today 💕
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all hover:rotate-90 duration-300 flex-shrink-0"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-5">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${newPostAnonymous ? 'from-gray-500 to-gray-600' : 'from-pink-400 to-purple-500'} flex items-center justify-center text-white shadow-lg transition-all`}>
                      {newPostAnonymous ? <EyeOff className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">
                        Post as {newPostAnonymous ? 'Anonymous' : 'Yourself'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {newPostAnonymous ? 'Your identity will be hidden' : 'Your name will be shown'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewPostAnonymous(!newPostAnonymous)}
                    className={`relative w-14 h-8 rounded-full transition-all shadow-inner ${
                      newPostAnonymous
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-gray-200'
                    }`}
                  >
                    <motion.div
                      animate={{ x: newPostAnonymous ? 28 : 3 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center"
                    >
                      {newPostAnonymous ? (
                        <EyeOff className="w-3 h-3 text-purple-500" />
                      ) : (
                        <User className="w-3 h-3 text-gray-500" />
                      )}
                    </motion.div>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2.5 flex items-center gap-2">
                    <span className="text-pink-500">*</span> Title
                  </label>
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="What's on your mind? e.g., Tips for first trimester fatigue"
                    className="w-full px-5 py-4 bg-gray-50/80 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium text-gray-700 placeholder-gray-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2.5 flex items-center gap-2">
                    <span className="text-pink-500">*</span> Category
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {CATEGORIES.filter((c) => c !== 'All Discussions').map((cat) => {
                      const isActive = newPostCategory === cat
                      const colorClass = CATEGORY_COLORS[cat] || ''
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewPostCategory(cat)}
                          className={`inline-flex items-center gap-2 px-3.5 py-3 rounded-2xl font-bold text-xs border transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent shadow-lg shadow-pink-200/50 scale-[1.02]'
                              : `bg-gradient-to-br ${colorClass} hover:shadow-md`
                          }`}
                        >
                          {CATEGORY_ICONS[cat]}
                          <span className="truncate">{cat}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2.5 flex items-center gap-2">
                    <span className="text-pink-500">*</span> Your Story
                  </label>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share your experience, ask a question, or offer support... Be detailed so others can relate and help!"
                    rows={6}
                    className="w-full px-5 py-4 bg-gray-50/80 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium text-gray-700 placeholder-gray-400 resize-none transition-all"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> Be kind, you&apos;re talking to real people
                    </span>
                    <span className={`font-bold ${newPostContent.length > 500 ? 'text-amber-500' : ''}`}>
                      {newPostContent.length} / 1000
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 px-6 sm:px-8 py-5 border-t border-gray-100 bg-white/90 backdrop-blur-xl sm:rounded-b-3xl sticky bottom-0">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitPost}
                    disabled={!newPostTitle.trim() || !newPostContent.trim()}
                    className="flex-[2] py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white rounded-2xl font-black shadow-xl shadow-pink-200/50 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-all"
                  >
                    <Send className="w-5 h-5" />
                    Post to Community
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function EyeOff(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}
