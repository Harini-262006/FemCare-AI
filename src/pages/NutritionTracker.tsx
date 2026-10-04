import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Apple,
  Droplets,
  Plus,
  Minus,
  Target,
  Leaf,
  Utensils,
  Coffee,
  Sun,
  Moon,
  Sparkles,
  Flame,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  Leaf as LeafIcon,
  Heart,
  Calendar,
  Activity,
  Brain,
  Zap,
  X,
  Award,
  Clock,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import BackToHomeButton from '../components/BackToHomeButton'
import { useProfile } from '../store'

type TabType = 'overview' | 'meal-plans' | 'recipes' | 'nutrients' | 'water'

const MEAL_CATEGORIES: Record<string, { gradient: string; icon: React.ReactNode; label: string }> = {
  breakfast: { gradient: 'from-amber-400 to-orange-500', icon: <Coffee className="w-5 h-5" />, label: 'Breakfast' },
  lunch: { gradient: 'from-emerald-400 to-teal-500', icon: <Sun className="w-5 h-5" />, label: 'Lunch' },
  snack: { gradient: 'from-fuchsia-400 to-pink-500', icon: <Star className="w-5 h-5" />, label: 'Snack' },
  dinner: { gradient: 'from-indigo-400 to-purple-500', icon: <Moon className="w-5 h-5" />, label: 'Dinner' },
}

const IRON_RICH_FOODS = [
  { name: 'Spinach', iron: '2.7mg / 100g', serving: '1 cup cooked', tip: 'Pair with vitamin C (lemon/orange) for better absorption', emoji: '🥬' },
  { name: 'Lentils', iron: '6.6mg / 100g', serving: '1/2 cup cooked', tip: 'Great in soups, salads, and dals', emoji: '🫘' },
  { name: 'Red Meat', iron: '2.6mg / 100g', serving: '100g lean cut', tip: 'Heme iron - most absorbable form', emoji: '🥩' },
  { name: 'Tofu', iron: '5.4mg / 100g', serving: '100g firm tofu', tip: 'Perfect vegetarian protein source', emoji: '🧈' },
  { name: 'Chickpeas', iron: '2.8mg / 100g', serving: '1/2 cup', tip: 'Great in hummus and curries', emoji: '🫛' },
  { name: 'Pumpkin Seeds', iron: '8.8mg / 28g', serving: '1/4 cup', tip: 'Sprinkle on salads or eat as snack', emoji: '🎃' },
]

const CALCIUM_RICH_FOODS = [
  { name: 'Milk', calcium: '300mg / cup', serving: '1 cup (240ml)', tip: 'Go for low-fat if watching calories', emoji: '🥛' },
  { name: 'Yogurt', calcium: '450mg / cup', serving: '1 cup plain Greek', tip: 'Also great for probiotics & digestion', emoji: '🥛' },
  { name: 'Cheese', calcium: '200mg / 40g', serving: '40g paneer/cheddar', tip: 'Pair with vitamin D for absorption', emoji: '🧀' },
  { name: 'Sardines', calcium: '325mg / can', serving: '1 small can (with bones)', tip: 'Omega-3s + calcium combo!', emoji: '🐟' },
  { name: 'Almonds', calcium: '75mg / 30g', serving: '23 almonds', tip: 'Great as a midday snack', emoji: '🌰' },
  { name: 'Kale', calcium: '180mg / 2 cups', serving: '2 cups chopped raw', tip: 'Massage with olive oil for salad', emoji: '🥗' },
]

const TRIMESTER_MEAL_PLANS: Record<string, { week: string; meals: Record<string, { name: string; calories: number; emoji: string; desc: string }[]>; tips: string[] }> = {
  first: {
    week: 'First Trimester (Week 1-12)',
    meals: {
      breakfast: [
        { name: 'Oatmeal with Berries', calories: 320, emoji: '🥣', desc: 'Oats cooked in milk, topped with strawberries, honey, and chia seeds' },
        { name: 'Scrambled Eggs & Toast', calories: 350, emoji: '🍳', desc: '2 eggs with spinach, 1 slice whole-grain toast, avocado' },
        { name: 'Smoothie Bowl', calories: 380, emoji: '🥤', desc: 'Banana, mango, spinach, yogurt blend topped with granola' },
      ],
      lunch: [
        { name: 'Dal & Brown Rice', calories: 450, emoji: '🍛', desc: 'Yellow dal, 1 cup brown rice, mixed vegetable sabzi, curd' },
        { name: 'Grilled Chicken Salad', calories: 400, emoji: '🥗', desc: '150g grilled chicken, quinoa, mixed greens, olive oil dressing' },
        { name: 'Veggie Wrap', calories: 380, emoji: '🌯', desc: 'Whole wheat wrap with hummus, grilled veggies, feta cheese' },
      ],
      snack: [
        { name: 'Greek Yogurt & Nuts', calories: 200, emoji: '🥜', desc: '1/2 cup Greek yogurt + 10 almonds + 1 date' },
        { name: 'Apple & Peanut Butter', calories: 220, emoji: '🍎', desc: '1 medium apple + 1 tbsp natural peanut butter' },
        { name: 'Sprout Chaat', calories: 180, emoji: '🥗', desc: 'Mixed sprouts with lemon, onion, tomato, spices' },
      ],
      dinner: [
        { name: 'Fish & Vegetables', calories: 480, emoji: '🐟', desc: '150g baked salmon, roasted broccoli, sweet potato mash' },
        { name: 'Paneer & Veggies', calories: 420, emoji: '🥘', desc: 'Paneer bhurji, lauki sabzi, 2 phulkas (no ghee), salad' },
        { name: 'Chicken Soup', calories: 350, emoji: '🍜', desc: 'Clear chicken & vegetable soup + 2 slices whole wheat bread' },
      ],
    },
    tips: [
      'Morning sickness? Eat dry toast/crackers BEFORE getting out of bed',
      'Stay hydrated - aim for 8-10 glasses even if food feels tough',
      'Take prenatal vitamin WITH a meal to reduce nausea',
      'Ginger tea, lemon drops, and small meals help with nausea',
    ],
  },
  second: {
    week: 'Second Trimester (Week 13-27)',
    meals: {
      breakfast: [
        { name: 'Protein Pancakes', calories: 450, emoji: '🥞', desc: 'Oats + banana + egg pancakes with peanut butter drizzle' },
        { name: 'Poha & Milk', calories: 400, emoji: '🍚', desc: 'Vegetable poha with peanuts + 1 glass protein milk' },
        { name: 'Avocado Toast', calories: 420, emoji: '🥑', desc: '2 slices sourdough + avocado + 2 poached eggs + chili flakes' },
      ],
      lunch: [
        { name: 'Rajma Chawal', calories: 550, emoji: '🍱', desc: 'Kidney beans curry, 1 cup brown rice, cucumber raita, salad' },
        { name: 'Turkey & Quinoa', calories: 500, emoji: '🍗', desc: '180g roast turkey, 1 cup quinoa, roasted veggies, hummus' },
        { name: 'Pasta Primavera', calories: 480, emoji: '🍝', desc: 'Whole wheat pasta, veggies, olive oil, parmesan, chicken option' },
      ],
      snack: [
        { name: 'Trail Mix', calories: 280, emoji: '🌰', desc: 'Almonds, walnuts, pumpkin seeds, raisins, dark chocolate chips' },
        { name: 'Cheese & Crackers', calories: 260, emoji: '🧀', desc: '30g paneer/cheese, 3 whole grain crackers, grapes' },
        { name: 'Mango Lassi', calories: 240, emoji: '🥭', desc: 'Blend mango, yogurt, a splash of milk, cardamom' },
      ],
      dinner: [
        { name: 'Chicken Biryani', calories: 600, emoji: '🍚', desc: 'Brown rice biryani with 150g chicken, raita, salad. Less oil!' },
        { name: 'Soybean Curry', calories: 520, emoji: '🥘', desc: 'Soybean chunks curry, 2 phulkas, mixed sabzi, curd + jaggery' },
        { name: 'Stir Fry Bowl', calories: 500, emoji: '🥡', desc: 'Tofu/shrimp + veggies in soy-ginger sauce, 1 cup brown rice' },
      ],
    },
    tips: [
      'Baby grows fast! Add 300-400 extra calories/day from nutrient-dense foods',
      'This is the EATING trimester - enjoy food but choose quality over junk',
      'Iron + calcium: Don\'t take at same meal. Block absorption!',
      'Add 1 serving of omega-3 (walnuts, fish, flax seeds) daily for baby brain',
    ],
  },
  third: {
    week: 'Third Trimester (Week 28-40)',
    meals: {
      breakfast: [
        { name: 'Dalia Porridge', calories: 420, emoji: '🥣', desc: 'Broken wheat cooked in milk with dates, almonds, cardamom' },
        { name: 'Cheese Omelette', calories: 450, emoji: '🧀', desc: '3 egg omelette with cheese, bell peppers, spinach + 2 toast' },
        { name: 'Ragi Dosa & Chutney', calories: 400, emoji: '🥞', desc: '2 finger millet (ragi) dosa with coconut chutney + 1 glass buttermilk' },
      ],
      lunch: [
        { name: 'Chole & Paneer', calories: 580, emoji: '🫘', desc: 'Chole masala, paneer sabzi, 2 phulkas, green chutney, salad' },
        { name: 'Lentil + Sweet Potato', calories: 520, emoji: '🍠', desc: 'Mixed dal, mashed sweet potato, sauteed greens, curd rice' },
        { name: 'Beef & Veggies', calories: 550, emoji: '🥩', desc: '120g minced beef curry, 1 cup brown rice, bhindi sabzi, salad' },
      ],
      snack: [
        { name: 'Banana + Milkshake', calories: 320, emoji: '🍌', desc: '1 banana + 1 glass milk + 1 tbsp protein powder + peanut butter' },
        { name: 'Date & Nut Ladoo', calories: 250, emoji: '🫶', desc: '2 homemade ladoos (dates, cashews, almonds, ghee, cardamom)' },
        { name: 'Jowar Dhokla', calories: 220, emoji: '🍥', desc: '2 pieces sorghum dhokla with mint chutney + herbal tea' },
      ],
      dinner: [
        { name: 'Palak Paneer & Paratha', calories: 560, emoji: '🥬', desc: 'Spinach paneer curry, 2 methi parathas (olive oil), cucumber raita' },
        { name: 'Chicken & Veg Curry', calories: 540, emoji: '🍛', desc: '200g chicken curry, lauki/ghiya sabzi, 2 phulkas, end with saffron milk' },
        { name: 'Pumpkin & Black Rice', calories: 500, emoji: '🎃', desc: 'Pumpkin sabzi, 1 cup black/forbidden rice, dal tadka, salad' },
      ],
    },
    tips: [
      'Eat small frequent meals - baby is squishing your stomach!',
      'Add 1 glass of milk/day minimum: protein + calcium for bones',
      'Fiber (fruits, veggies, whole grains) = no constipation! 🎯',
      'Hydration + protein combo helps reduce swelling in legs',
    ],
  },
}

const PCOS_DIET_TIPS = [
  { do: true, title: 'High Fiber Foods', desc: 'Oats, quinoa, brown rice, whole wheat, lentils, leafy greens', icon: '🌾' },
  { do: true, title: 'Lean Protein', desc: 'Chicken, fish, tofu, paneer, Greek yogurt, eggs, pulses', icon: '🍗' },
  { do: true, title: 'Healthy Fats', desc: 'Avocado, nuts, seeds, olive oil, ghee (moderation), fatty fish', icon: '🥑' },
  { do: true, title: 'Anti-inflammatory', desc: 'Turmeric, ginger, berries, leafy greens, omega-3 rich foods', icon: '💚' },
  { do: false, title: 'Sugary Foods', desc: 'Sodas, juices, pastries, ice cream, white sugar, sweet yogurt', icon: '🍰' },
  { do: false, title: 'Refined Carbs', desc: 'White bread, maida roti, white rice, pasta, pastries, instant noodles', icon: '🍞' },
  { do: false, title: 'Processed Foods', desc: 'Packaged snacks, fast food, frozen meals, canned foods with additives', icon: '🍟' },
  { do: false, title: 'Dairy excess', desc: 'Limit full-fat dairy if worsening symptoms; try almond/oat milk', icon: '🧀' },
]

const HEALTHY_RECIPES = [
  {
    title: 'Iron-Rich Spinach Dal',
    time: '30 min',
    difficulty: 'Easy',
    serves: 2,
    category: 'Lunch',
    emoji: '🍛',
    ingredients: ['1/2 cup toor dal', '2 cups spinach', '1 onion', '2 tomatoes', '1 tsp turmeric', '1 tsp jeera', '1 tsp garlic', '2 tsp ghee', 'Salt', 'Lemon juice'],
    instructions: [
      'Wash and pressure cook dal with turmeric for 3 whistles',
      'Heat ghee, add jeera, then garlic and onions until golden',
      'Add tomatoes, cook until soft, then add chopped spinach',
      'Pour in cooked dal, add water to adjust consistency, simmer 10 mins',
      'Finish with salt, lemon juice, and a drizzle of ghee. Serve with rice!'
    ],
    calories: 320,
    protein: 18,
    iron: 5,
  },
  {
    title: 'Pregnancy Power Smoothie',
    time: '5 min',
    difficulty: 'Very Easy',
    serves: 1,
    category: 'Breakfast',
    emoji: '🥤',
    ingredients: ['1 banana', '1/2 cup spinach', '1/2 cup Greek yogurt', '1 cup almond milk', '1 tbsp almond butter', '1 tsp chia seeds', '1 tsp honey (opt)', '4-5 soaked almonds'],
    instructions: [
      'Blend almond milk, banana, spinach, and yogurt until smooth',
      'Add almond butter, chia seeds, almonds, and honey',
      'Blend again until creamy. Pour into a tall glass and enjoy!',
    ],
    calories: 450,
    protein: 22,
    calcium: 350,
  },
  {
    title: 'Ragi (Finger Millet) Pancakes',
    time: '20 min',
    difficulty: 'Easy',
    serves: 2,
    category: 'Breakfast',
    emoji: '🥞',
    ingredients: ['1/2 cup ragi flour', '2 eggs OR 1/2 cup curd', '1 small banana (mashed)', '1/4 cup milk', '1 tsp jaggery', 'Pinch cardamom', 'Ghee for cooking'],
    instructions: [
      'Mix all ingredients (except ghee) into a smooth, pourable batter',
      'Heat a non-stick pan, pour a small ladle of batter',
      'Cook on medium until bubbles form, flip and cook other side',
      'Serve with peanut butter, honey, or fruit!',
    ],
    calories: 280,
    calcium: 180,
    iron: 4,
  },
  {
    title: 'Quinoa & Chickpea Salad',
    time: '20 min',
    difficulty: 'Easy',
    serves: 2,
    category: 'Lunch',
    emoji: '🥗',
    ingredients: ['1 cup cooked quinoa', '1/2 cup boiled chickpeas', '1 cucumber', '1 tomato', '1/2 bell pepper', '1/4 red onion', 'Feta/paneer cubes', 'Olive oil + lemon dressing'],
    instructions: [
      'Chop all veggies into bite-sized cubes',
      'In a big bowl combine quinoa, chickpeas, veggies',
      'Add crumbled feta/paneer on top',
      'Drizzle with olive oil + lemon + salt + pepper. Toss & serve!',
    ],
    calories: 380,
    protein: 18,
    fiber: 11,
  },
  {
    title: 'Date & Nut Energy Balls',
    time: '15 min',
    difficulty: 'Very Easy',
    serves: '12 balls',
    category: 'Snack',
    emoji: '🫶',
    ingredients: ['1 cup soft dates (seeded)', '1/2 cup cashews', '1/2 cup almonds', '2 tbsp cocoa powder', '2 tbsp desiccated coconut', '1 tsp ghee', 'Cardamom pinch'],
    instructions: [
      'Soak dates in warm water for 10 mins, drain',
      'Blend all ingredients in a food processor until sticky',
      'Wet hands, roll into 1-inch balls',
      'Coat in coconut/cocoa powder. Chill 30 mins before eating!'
    ],
    calories: 90,
    iron: 1,
    calcium: 30,
  },
  {
    title: 'Creamy Tomato & Pumpkin Soup',
    time: '25 min',
    difficulty: 'Easy',
    serves: 3,
    category: 'Dinner',
    emoji: '🍜',
    ingredients: ['500g pumpkin', '2 tomatoes', '1 onion', '3 garlic cloves', '1 cup vegetable stock', '1/4 cup cream/coconut milk', 'Butter/ghee', 'Salt & pepper', 'Pumpkin seeds for garnish'],
    instructions: [
      'Roast pumpkin cubes at 180C for 20 mins until soft',
      'In butter, sauté onion, garlic, tomatoes until golden',
      'Add roasted pumpkin + stock, simmer 10 mins',
      'Blend until super smooth! Return to heat, stir in cream',
      'Season, garnish with seeds & cream swirl. Comfort in a bowl 🥰'
    ],
    calories: 210,
    vitaminA: '180% RDA',
    fiber: 5,
  },
]

const AFFIRMATIONS = [
  'I am strong, healthy, and fully capable of nourishing my body beautifully 🌸',
  'Every bite I take is a loving gift to my future self and my baby 💕',
  'My body knows exactly what to do - I trust it completely ✨',
  'Food is medicine and pleasure - I allow myself to enjoy both fully 🍽️',
  'I am exactly where I need to be - progress, not perfection 🌱',
  'Hydration is self-care, and I prioritize it every single hour 💧',
  'I nourish my mind with positivity and my body with real foods 🧘‍♀️',
  'My cravings are information - I listen to my body with kindness & wisdom 🍫',
]

export default function NutritionTracker() {
  const navigate = useNavigate()
  const profile = useProfile()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [waterGlasses, setWaterGlasses] = useState(() => {
    const saved = localStorage.getItem('nutrition-water')
    return saved ? parseInt(saved) : 0
  })
  const [waterGoal, setWaterGoal] = useState(profile?.waterIntake ? profile.waterIntake * 4 : 8)
  const [proteinGoal] = useState(() => profile?.pregnancyStatus === 'Yes' || profile?.pregnancyStatus === 'Pregnant' ? 75 : 60)
  const [proteinGrams, setProteinGrams] = useState(() => {
    const saved = localStorage.getItem('nutrition-protein')
    return saved ? parseInt(saved) : 0
  })
  const [calorieGoal] = useState(() => {
    const base = (profile?.weight || 60) * 30
    if (profile?.pregnancyStatus === 'Yes' || profile?.pregnancyStatus === 'Pregnant') return base + 350
    return base
  })
  const [calories, setCalories] = useState(() => {
    const saved = localStorage.getItem('nutrition-calories')
    return saved ? parseInt(saved) : 0
  })
  const [selectedTrimester, setSelectedTrimester] = useState<'first' | 'second' | 'third'>(
    profile?.pregnancyStatus === 'Yes' || profile?.pregnancyStatus === 'Pregnant' ? 'second' : 'first'
  )
  const [mealEntries, setMealEntries] = useState<Record<string, { name: string; calories: number }[]>>(() => {
    const saved = localStorage.getItem('nutrition-meals')
    return saved ? JSON.parse(saved) : { breakfast: [], lunch: [], snack: [], dinner: [] }
  })
  const [showAddMeal, setShowAddMeal] = useState<string | null>(null)
  const [newMealName, setNewMealName] = useState('')
  const [newMealCalories, setNewMealCalories] = useState('')
  const [todayAffirmation] = useState(AFFIRMATIONS[new Date().getDate() % AFFIRMATIONS.length])

  useEffect(() => {
    localStorage.setItem('nutrition-water', waterGlasses.toString())
    localStorage.setItem('nutrition-protein', proteinGrams.toString())
    localStorage.setItem('nutrition-calories', calories.toString())
    localStorage.setItem('nutrition-meals', JSON.stringify(mealEntries))
  }, [waterGlasses, proteinGrams, calories, mealEntries])

  const totalMealCalories = useMemo(() => (
    Object.values(mealEntries).flat().reduce((sum, m) => sum + m.calories, 0)
  ), [mealEntries])

  const displayCalories = calories + totalMealCalories
  const caloriePercentage = Math.min(100, (displayCalories / calorieGoal) * 100)
  const waterPercentage = Math.min(100, (waterGlasses / waterGoal) * 100)
  const proteinPercentage = Math.min(100, (proteinGrams / proteinGoal) * 100)

  const addMealEntry = (category: string) => {
    if (!newMealName || !newMealCalories) return
    setMealEntries(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), { name: newMealName, calories: parseInt(newMealCalories) }]
    }))
    setProteinGrams(p => p + Math.round(parseInt(newMealCalories) * 0.18))
    setNewMealName('')
    setNewMealCalories('')
    setShowAddMeal(null)
  }

  const tabButtons: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'meal-plans', label: 'Meal Plans', icon: <Utensils className="w-4 h-4" /> },
    { key: 'recipes', label: 'Recipes', icon: <Leaf className="w-4 h-4" /> },
    { key: 'nutrients', label: 'Nutrients', icon: <Activity className="w-4 h-4" /> },
    { key: 'water', label: 'Hydration', icon: <Droplets className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-emerald-50 py-6 lg:py-10 relative overflow-x-hidden">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <BackToHomeButton />
          <div className="flex-1 min-w-0 text-center md:text-right">
            <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-green-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              🍏 Nutrition & Diet Center
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-1 md:justify-end justify-center">
              <Apple className="w-4 h-4 text-green-500" />
              Nourish your body - you are what you eat!
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-r from-pink-400 via-purple-400 to-teal-400 rounded-3xl p-[2px] shadow-xl"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-[calc(1.5rem-2px)] p-5 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-teal-100 flex items-center justify-center text-5xl md:text-6xl flex-shrink-0 animate-float">
              🌸
            </div>
            <div className="flex-1 min-w-0 text-center md:text-left">
              <div className="text-xs font-black uppercase tracking-widest text-purple-500 mb-1.5">Today's Affirmation</div>
              <div className="text-lg md:text-xl font-bold text-gray-800 leading-snug">{todayAffirmation}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Award className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
              <span className="font-black text-amber-600 text-sm md:text-base">Mindful Eating</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Calories', value: displayCalories, goal: calorieGoal, unit: 'kcal', icon: <Flame className="w-5 h-5" />, color: 'from-orange-400 to-red-500', percent: caloriePercentage },
            { label: 'Water', value: waterGlasses, goal: waterGoal, unit: 'glasses', icon: <Droplets className="w-5 h-5" />, color: 'from-cyan-400 to-blue-500', percent: waterPercentage },
            { label: 'Protein', value: proteinGrams, goal: proteinGoal, unit: 'g', icon: <Zap className="w-5 h-5" />, color: 'from-violet-400 to-purple-500', percent: proteinPercentage },
            { label: 'Meals Logged', value: Object.values(mealEntries).flat().length, goal: 6, unit: 'today', icon: <Utensils className="w-5 h-5" />, color: 'from-emerald-400 to-teal-500', percent: Math.min(100, (Object.values(mealEntries).flat().length / 6) * 100) },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative overflow-hidden bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-white/60"
            >
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md mb-4`}>
                {stat.icon}
              </div>
              <div className="text-xs font-bold uppercase text-gray-400 tracking-wide mb-1">{stat.label}</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl md:text-4xl font-black text-gray-800">{stat.value}</span>
                <span className="text-sm font-bold text-gray-400">/ {stat.goal} <span className="text-xs">{stat.unit}</span></span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percent}%` }}
                  transition={{ duration: 1, delay: 0.2 + idx * 0.08, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-2 px-2"
        >
          {tabButtons.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 text-white shadow-xl shadow-emerald-200 scale-105'
                  : 'bg-white/80 text-gray-600 hover:bg-white hover:shadow-md border border-gray-100'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-3 gap-6 mb-8"
            >
              <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-7 shadow-xl border border-white/60">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <h3 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2">
                    <Utensils className="w-6 h-6 text-orange-500" />
                    Today's Food Diary
                  </h3>
                  <div className="text-xs font-bold bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full">
                    {totalMealCalories} kcal logged • Keep going! 💪
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(MEAL_CATEGORIES).map(([cat, info]) => (
                    <div key={cat} className="p-4 md:p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center text-white shadow-md`}>
                            {info.icon}
                          </div>
                          <div>
                            <h4 className="font-black text-gray-800">{info.label}</h4>
                            <div className="text-xs text-gray-400 font-semibold">
                              {mealEntries[cat]?.length || 0} item{mealEntries[cat]?.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowAddMeal(showAddMeal === cat ? null : cat)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-all ${
                            showAddMeal === cat
                              ? 'bg-gray-200 text-gray-700'
                              : `bg-gradient-to-r ${info.gradient} text-white shadow-md hover:shadow-lg`
                          }`}
                        >
                          {showAddMeal === cat ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          {showAddMeal === cat ? 'Close' : 'Add Food'}
                        </button>
                      </div>
                      <AnimatePresence>
                        {showAddMeal === cat && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-3 overflow-hidden"
                          >
                            <div className="p-4 rounded-xl bg-white shadow-md border border-gray-100 flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                placeholder="Food name (e.g., Oatmeal)"
                                value={newMealName}
                                onChange={(e) => setNewMealName(e.target.value)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-semibold text-sm"
                              />
                              <input
                                type="number"
                                placeholder="Calories"
                                value={newMealCalories}
                                onChange={(e) => setNewMealCalories(e.target.value)}
                                className="sm:w-28 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 font-semibold text-sm"
                              />
                              <button
                                onClick={() => addMealEntry(cat)}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md hover:shadow-lg transition-all"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="space-y-2">
                        {mealEntries[cat]?.map((meal, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-lg flex-shrink-0">
                                {info.label === 'Breakfast' ? '🍳' : info.label === 'Lunch' ? '🥗' : info.label === 'Snack' ? '🍎' : '🍲'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-gray-800 truncate">{meal.name}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="font-black text-orange-600 text-sm">{meal.calories} kcal</span>
                              <button
                                onClick={() => {
                                  setMealEntries(prev => ({ ...prev, [cat]: prev[cat].filter((_, idx) => idx !== i) }))
                                  setCalories(c => Math.max(0, c - meal.calories))
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                        {(!mealEntries[cat] || mealEntries[cat].length === 0) && (
                          <div className="text-center py-6 text-gray-400 text-sm font-medium">
                            No {info.label.toLowerCase()} logged yet
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-7 shadow-xl border border-white/60">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <Droplets className="w-6 h-6 text-cyan-500" />
                        Quick Hydration
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">Tap glasses to log them!</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl shadow-lg animate-float">
                      💧
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mb-5">
                    {Array.from({ length: waterGoal }).map((_, i) => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1, y: -3 }}
                        onClick={() => i < waterGlasses ? setWaterGlasses(i) : setWaterGlasses(i + 1)}
                        className={`aspect-square rounded-xl flex items-center justify-center text-xl md:text-2xl transition-all ${
                          i < waterGlasses
                            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-200'
                            : 'bg-gray-50 border border-gray-100 opacity-50 hover:opacity-80'
                        }`}
                      >
                        💧
                      </motion.button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                      className="py-3 rounded-xl bg-gray-50 text-gray-600 font-bold hover:bg-gray-100 transition-colors text-sm"
                    >
                      <Minus className="w-4 h-4 inline mr-1" /> Remove
                    </button>
                    <button
                      onClick={() => setWaterGlasses(Math.min(waterGoal, waterGlasses + 1))}
                      className="py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-md hover:shadow-lg transition-all text-sm"
                    >
                      <Plus className="w-4 h-4 inline mr-1" /> Add Glass
                    </button>
                  </div>
                </div>
                {profile?.pcos === 'Yes' && (
                  <div className="bg-gradient-to-br from-violet-400 via-purple-400 to-fuchsia-400 rounded-3xl p-7 text-white shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl border border-white/20">
                        💜
                      </div>
                      <div>
                        <h3 className="text-xl font-black">PCOS Diet Mode</h3>
                        <p className="text-white/80 text-sm">Personalized for your needs</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {PCOS_DIET_TIPS.slice(0, 4).map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                          <span className="text-lg flex-shrink-0 mt-0.5">{tip.icon}</span>
                          <div className="text-sm">
                            <span className={`font-black ${tip.do ? 'text-green-200' : 'text-red-200'}`}>
                              {tip.do ? '✅ EAT: ' : '❌ AVOID: '}
                            </span>
                            <span className="font-semibold">{tip.title}</span>
                            <span className="text-white/70 block text-xs mt-0.5">{tip.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveTab('nutrients')}
                      className="w-full mt-5 py-3.5 rounded-2xl bg-white text-purple-600 font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      View Full PCOS Guide <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'meal-plans' && (
            <motion.div
              key="meal-plans"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-white/60 mb-6">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-purple-500" />
                      Trimester-Specific Meal Plans
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Personalized nutrition for every stage of your journey 💚</p>
                  </div>
                  <div className="flex p-1.5 bg-gray-100 rounded-2xl">
                    {(['first', 'second', 'third'] as const).map((trim) => (
                      <button
                        key={trim}
                        onClick={() => setSelectedTrimester(trim)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                          selectedTrimester === trim
                            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        {trim === 'first' ? '1st Tri' : trim === 'second' ? '2nd Tri' : '3rd Tri'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border border-purple-100 mb-7">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-purple-400 via-pink-400 to-rose-400 flex items-center justify-center text-white text-2xl md:text-3xl shadow-lg flex-shrink-0">
                      💡
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-gray-800 text-lg md:text-xl mb-2">{TRIMESTER_MEAL_PLANS[selectedTrimester].week} - Expert Tips</h4>
                      <ul className="grid md:grid-cols-2 gap-2 md:gap-2.5">
                        {TRIMESTER_MEAL_PLANS[selectedTrimester].tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 p-2 md:p-2.5 rounded-xl bg-white/60 border border-white">
                            <Sparkles className="w-4 h-4 md:w-4.5 md:h-4.5 text-pink-500 flex-shrink-0 mt-0.5" />
                            <span className="font-semibold">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  {Object.entries(TRIMESTER_MEAL_PLANS[selectedTrimester].meals).map(([cat, meals], gIdx) => {
                    const catInfo = MEAL_CATEGORIES[cat]
                    return (
                      <motion.div
                        key={cat}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: gIdx * 0.08 }}
                        className={`rounded-3xl overflow-hidden border-2 border-transparent bg-gradient-to-br ${catInfo.gradient} p-[3px] shadow-xl`}
                      >
                        <div className="bg-white rounded-[calc(1.5rem-3px)] p-5 md:p-6">
                          <div className="flex items-center gap-3 mb-5">
                            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${catInfo.gradient} flex items-center justify-center text-white shadow-md`}>
                              {catInfo.icon}
                            </div>
                            <div>
                              <h4 className="font-black text-gray-800 text-lg">{catInfo.label} Ideas</h4>
                              <div className="text-xs text-gray-400 font-semibold">Choose 1 per {catInfo.label.toLowerCase()}</div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {meals.map((meal, i) => (
                              <motion.div
                                key={i}
                                whileHover={{ x: 4, scale: 1.01 }}
                                className="p-4 rounded-2xl bg-gray-50 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white border border-gray-100 cursor-pointer transition-all group"
                                onClick={() => {
                                  setMealEntries(prev => ({
                                    ...prev,
                                    [cat]: [...(prev[cat] || []), { name: meal.name, calories: meal.calories }]
                                  }))
                                  setCalories(c => c + meal.calories)
                                  setProteinGrams(p => p + Math.round(meal.calories * 0.18))
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-3xl md:text-4xl flex-shrink-0 group-hover:scale-110 transition-transform">
                                    {meal.emoji}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="font-black text-gray-800 truncate">{meal.name}</span>
                                      <span className="text-xs font-black bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                                        {meal.calories} kcal
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed">{meal.desc}</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex justify-end">
                                  <span className="text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-3 h-3" /> Tap to add to diary
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'recipes' && (
            <motion.div
              key="recipes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-8"
            >
              {HEALTHY_RECIPES.map((recipe, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="group relative bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl border border-white/60 hover:shadow-2xl transition-all cursor-pointer"
                >
                  <div className="h-40 md:h-44 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center text-7xl md:text-8xl relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_70%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.15),transparent_50%)]" />
                    <motion.span
                      className="relative z-10 group-hover:scale-125 transition-transform duration-500"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: idx * 0.2 }}
                    >
                      {recipe.emoji}
                    </motion.span>
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <h4 className="font-black text-gray-800 text-lg md:text-xl leading-tight">{recipe.title}</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600">
                        <Clock className="w-3 h-3" /> {recipe.time}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                        {recipe.difficulty}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">
                        {recipe.serves} servings
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-pink-50 text-pink-600">
                        {recipe.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2.5 pb-4 mb-4 border-b border-gray-100">
                      {recipe.calories !== undefined && (
                        <div className="text-center px-2.5 py-1.5 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100">
                          <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">Calories</div>
                          <div className="font-black text-orange-700 text-sm md:text-base">{recipe.calories}</div>
                        </div>
                      )}
                      {recipe.protein !== undefined && (
                        <div className="text-center px-2.5 py-1.5 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                          <div className="text-[10px] font-bold text-violet-500 uppercase tracking-wide">Protein</div>
                          <div className="font-black text-violet-700 text-sm md:text-base">{recipe.protein}g</div>
                        </div>
                      )}
                      {recipe.iron !== undefined && (
                        <div className="text-center px-2.5 py-1.5 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100">
                          <div className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Iron</div>
                          <div className="font-black text-red-700 text-sm md:text-base">{recipe.iron}mg</div>
                        </div>
                      )}
                      {recipe.calcium !== undefined && (
                        <div className="text-center px-2.5 py-1.5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                          <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">Calcium</div>
                          <div className="font-black text-blue-700 text-sm md:text-base">{recipe.calcium}mg</div>
                        </div>
                      )}
                      {recipe.fiber !== undefined && (
                        <div className="text-center px-2.5 py-1.5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                          <div className="text-[10px] font-bold text-green-500 uppercase tracking-wide">Fiber</div>
                          <div className="font-black text-green-700 text-sm md:text-base">{recipe.fiber}g</div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-black uppercase text-gray-500 tracking-wider">Ingredients</div>
                      <div className="flex flex-wrap gap-1.5">
                        {recipe.ingredients.slice(0, 6).map((ing, i) => (
                          <span key={i} className="text-xs font-semibold text-gray-600 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100">
                            {ing}
                          </span>
                        ))}
                        {recipe.ingredients.length > 6 && (
                          <span className="text-xs font-bold text-gray-400 px-2 py-1">+{recipe.ingredients.length - 6} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'nutrients' && (
            <motion.div
              key="nutrients"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 mb-8"
            >
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-7 shadow-xl border border-white/60">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white shadow-lg">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-gray-800">Iron Rich Foods</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Critical during periods & pregnancy 🩸</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {IRON_RICH_FOODS.map((food, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-2xl bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 border border-red-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-4xl flex-shrink-0">
                            {food.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                              <h4 className="font-black text-gray-800 text-lg">{food.name}</h4>
                              <span className="text-xs font-black bg-red-100 text-red-700 px-3 py-1 rounded-full">{food.iron}</span>
                            </div>
                            <div className="text-xs font-bold text-gray-500 mb-1.5">Serving: {food.serving}</div>
                            <p className="text-xs md:text-sm font-medium text-gray-600 flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                              {food.tip}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-7 shadow-xl border border-white/60">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-gray-800">Calcium Rich Foods</h3>
                      <p className="text-sm text-gray-500 mt-0.5">For strong bones & teeth 🦴</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {CALCIUM_RICH_FOODS.map((food, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 border border-blue-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-4xl flex-shrink-0">
                            {food.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                              <h4 className="font-black text-gray-800 text-lg">{food.name}</h4>
                              <span className="text-xs font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{food.calcium}</span>
                            </div>
                            <div className="text-xs font-bold text-gray-500 mb-1.5">Serving: {food.serving}</div>
                            <p className="text-xs md:text-sm font-medium text-gray-600 flex items-start gap-1.5">
                              <Star className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                              {food.tip}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              {(profile?.pcos === 'Yes' || profile?.pcos === 'Suspected') && (
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-white/60">
                  <div className="flex items-center gap-3 mb-7 flex-wrap">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white shadow-xl text-2xl">
                      💜
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black text-gray-800">PCOS Nutrition & Lifestyle Guide</h3>
                      <p className="text-sm text-gray-500 mt-1">Evidence-based diet to manage symptoms and balance hormones naturally</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5 mb-6">
                    <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Check className="w-6 h-6 text-green-600" />
                        <h4 className="font-black text-gray-800 text-xl">DO: Eat These Every Day ✅</h4>
                      </div>
                      <div className="space-y-3">
                        {PCOS_DIET_TIPS.filter(t => t.do).map((tip, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white shadow-sm border border-green-100">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">
                              {tip.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-black text-green-800 mb-0.5">{tip.title}</div>
                              <p className="text-xs md:text-sm font-medium text-gray-600 leading-snug">{tip.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border border-red-100">
                      <div className="flex items-center gap-2 mb-4">
                        <X className="w-6 h-6 text-red-600" />
                        <h4 className="font-black text-gray-800 text-xl">DON'T: Limit These ❌</h4>
                      </div>
                      <div className="space-y-3">
                        {PCOS_DIET_TIPS.filter(t => !t.do).map((tip, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white shadow-sm border border-red-100">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center text-2xl flex-shrink-0 opacity-80">
                              {tip.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-black text-red-800 mb-0.5">{tip.title}</div>
                              <p className="text-xs md:text-sm font-medium text-gray-600 leading-snug">{tip.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { icon: '🏃', title: 'Daily Movement', desc: '30 min walk + strength training 3x week. Insulin sensitivity boost!' },
                      { icon: '😴', title: 'Quality Sleep', desc: '7-9 hours nightly. Sleep = balanced hunger hormones (ghrelin & leptin)' },
                      { icon: '🧘', title: 'Stress Management', desc: '10 min meditation + deep breathing. Stress worsens PCOS symptoms' },
                    ].map((item, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 border border-purple-100">
                        <div className="text-4xl mb-3">{item.icon}</div>
                        <div className="font-black text-gray-800 text-lg mb-1">{item.title}</div>
                        <p className="text-xs md:text-sm font-medium text-gray-600 leading-snug">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-6 text-white shadow-2xl col-span-2 md:col-span-1">
                  <Brain className="w-10 h-10 mb-3 opacity-90" />
                  <div className="text-xs font-black uppercase tracking-widest text-white/80 mb-2">Protein Goal</div>
                  <div className="text-4xl font-black mb-1">{proteinGoal}g</div>
                  <div className="text-sm text-white/80">per day - boosts metabolism & keeps you full longer</div>
                </div>
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-2xl col-span-2 md:col-span-1">
                  <LeafIcon className="w-10 h-10 mb-3 opacity-90" />
                  <div className="text-xs font-black uppercase tracking-widest text-white/80 mb-2">Fiber Goal</div>
                  <div className="text-4xl font-black mb-1">25-30g</div>
                  <div className="text-sm text-white/80">per day - balances blood sugar & aids digestion</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-6 text-white shadow-2xl col-span-2 md:col-span-1">
                  <Droplets className="w-10 h-10 mb-3 opacity-90" />
                  <div className="text-xs font-black uppercase tracking-widest text-white/80 mb-2">Water Goal</div>
                  <div className="text-4xl font-black mb-1">{waterGoal} glasses</div>
                  <div className="text-sm text-white/80">per day minimum - add lemon/herbs if plain is boring!</div>
                </div>
                <div className="bg-gradient-to-br from-violet-400 to-purple-500 rounded-3xl p-6 text-white shadow-2xl col-span-2 md:col-span-1">
                  <Heart className="w-10 h-10 mb-3 opacity-90" />
                  <div className="text-xs font-black uppercase tracking-widest text-white/80 mb-2">Healthy Fats</div>
                  <div className="text-4xl font-black mb-1">30-40g</div>
                  <div className="text-sm text-white/80">essential for hormone production & glowing skin</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'water' && (
            <motion.div
              key="water"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-3 gap-6 mb-8"
            >
              <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-white/60">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-2 md:justify-start justify-center mb-2">
                      💧 Daily Hydration Tracker
                    </h3>
                    <p className="text-gray-500 font-medium">
                      You're <span className="font-black text-cyan-600 text-lg">{Math.round(waterPercentage)}%</span> of the way there!
                    </p>
                  </div>
                  <div className="flex flex-col items-center shrink-0">
                    <div className="relative w-44 h-44 md:w-52 md:h-52">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="10" />
                        <motion.circle
                          cx="50" cy="50" r="42" fill="none" stroke="url(#waterGradient)" strokeWidth="10" strokeLinecap="round"
                          initial={{ strokeDasharray: '0, 264' }}
                          animate={{ strokeDasharray: `${(waterPercentage / 100) * 264}, 264` }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                        />
                        <defs>
                          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-5xl md:text-6xl font-black bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {waterGlasses}
                        </div>
                        <div className="text-sm md:text-base font-bold text-gray-500">/ {waterGoal} glasses</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-7">
                  <div className="text-sm font-black uppercase tracking-widest text-gray-500 mb-3">Tap to Log Glasses</div>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
                    {Array.from({ length: waterGoal }).map((_, i) => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.85, rotate: -5 }}
                        whileHover={{ scale: 1.15, y: -5 }}
                        onClick={() => i < waterGlasses ? setWaterGlasses(i) : setWaterGlasses(i + 1)}
                        className={`relative aspect-square rounded-2xl md:rounded-3xl flex flex-col items-center justify-center transition-all overflow-hidden ${
                          i < waterGlasses
                            ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 text-white shadow-xl shadow-cyan-200'
                            : 'bg-gray-50 border-2 border-dashed border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/40'
                        }`}
                      >
                        <motion.span
                          animate={i < waterGlasses ? { y: [0, -3, 0] } : {}}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                          className="text-2xl md:text-4xl"
                        >
                          💧
                        </motion.span>
                        <span className={`text-[10px] md:text-xs font-black mt-0.5 md:mt-1 ${i < waterGlasses ? 'text-white/95' : 'text-gray-400'}`}>
                          #{i + 1}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                    className="py-3.5 rounded-2xl bg-gray-50 text-gray-600 font-bold hover:bg-gray-100 transition-all text-sm md:text-base flex items-center justify-center gap-2 border border-gray-100"
                  >
                    <Minus className="w-4 h-4 md:w-5 md:h-5" /> Remove Glass
                  </button>
                  <button
                    onClick={() => setWaterGlasses(Math.min(waterGoal, waterGlasses + 1))}
                    className="py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-lg hover:shadow-xl transition-all text-sm md:text-base flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" /> Add 1 Glass
                  </button>
                  <button
                    onClick={() => setWaterGoal(Math.min(15, waterGoal + 1))}
                    className="py-3.5 rounded-2xl bg-white text-cyan-700 font-bold hover:bg-cyan-50 transition-all text-sm md:text-base flex items-center justify-center gap-2 border border-cyan-100"
                  >
                    <Target className="w-4 h-4 md:w-5 md:h-5" /> Goal +1
                  </button>
                  <button
                    onClick={() => { setWaterGlasses(0); setProteinGrams(0); setCalories(0); setMealEntries({ breakfast: [], lunch: [], snack: [], dinner: [] }) }}
                    className="py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-bold shadow-md hover:shadow-lg transition-all text-sm md:text-base flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" /> Reset Day
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 rounded-3xl p-7 text-white shadow-2xl">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl border border-white/20">
                      🌟
                    </div>
                    <div>
                      <h4 className="text-xl font-black">Why Water?</h4>
                      <p className="text-white/80 text-sm">Your miracle drink!</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      'Reduces bloating & water retention (counterintuitive but TRUE!)',
                      'Curbs false hunger signals (thirst is often mistaken for hunger)',
                      'Supports amniotic fluid production in pregnancy 🤰',
                      'Boosts energy, focus, and even mood!',
                      'Flushes toxins & supports glowing skin',
                      'Aids digestion & prevents constipation (big win in pregnancy!)',
                    ].map((fact, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-black">
                          {i + 1}
                        </div>
                        <span className="text-sm md:text-sm font-semibold leading-snug">{fact}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-7 shadow-xl border border-white/60">
                  <h4 className="font-black text-gray-800 text-xl mb-5 flex items-center gap-2">
                    ⏰ Hydration Schedule Suggestion
                  </h4>
                  <div className="space-y-2.5">
                    {[
                      { time: 'Upon waking', amount: '2 glasses', note: 'Kickstarts metabolism after 8hrs fast', emoji: '🌅' },
                      { time: 'Before breakfast', amount: '1 glass', note: '30 min before eating for optimal digestion', emoji: '🥞' },
                      { time: 'Mid-morning', amount: '1-2 glasses', note: 'Pre-lunch energy slump preventer', emoji: '🖥️' },
                      { time: 'Lunch time', amount: '1 glass', note: 'Sip slowly WITH meals, don\'t chug', emoji: '🥗' },
                      { time: 'Afternoon', amount: '1-2 glasses', note: 'When that 3pm slump hits! 💧 not ☕', emoji: '🌤️' },
                      { time: 'Dinner time', amount: '1 glass', note: 'Pair with dinner - add lemon for detox twist', emoji: '🍲' },
                      { time: 'Before bed', amount: 'Sip only', note: 'Don\'t drink too much to avoid night trips', emoji: '🌙' },
                    ].map((slot, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 border border-cyan-100 hover:shadow-sm transition-shadow">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl flex-shrink-0">
                          {slot.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-black text-gray-800 text-sm md:text-base">{slot.time}</span>
                            <span className="text-xs md:text-sm font-black bg-cyan-100 text-cyan-700 px-2.5 py-0.5 rounded-full whitespace-nowrap">{slot.amount}</span>
                          </div>
                          <div className="text-xs md:text-sm font-medium text-gray-500 leading-snug">{slot.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
