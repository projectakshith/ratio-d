import { DayOfWeek, MealType, MealTiming, DayMenu } from "@/types/mess";

export const MEAL_TIMINGS: Record<MealType, MealTiming> = {
  breakfast: { start: "07:00", end: "09:00", label: "7:00 AM – 9:00 AM" },
  lunch: { start: "11:30", end: "13:30", label: "11:30 AM – 1:30 PM" },
  snacks: { start: "16:30", end: "17:30", label: "4:30 PM – 5:30 PM" },
  dinner: { start: "19:30", end: "21:00", label: "7:30 PM – 9:00 PM" }
};

export const WEEKLY_MENU: Record<DayOfWeek, DayMenu> = {
  monday: {
    meals: {
      breakfast: ["Bread", "Butter", "Jam", "Ghee Pongal", "Sambar", "Coconut Chutney", "Vadai", "Tea / Coffee / Milk", "Boiled Egg (1 Piece)", "Chapathi", "Aloo Rajma Masala"],
      lunch: ["Payasam", "Poori", "Potato Masala", "Variety Rice", "Steamed Rice", "Sambar", "Dal Lasooni", "Tomato Rasam", "Kadai Vegetable", "Raw Banana Chops", "Special Fryums", "Butter Milk", "Pickle"],
      snacks: ["Pav Bhaji", "Tea / Coffee"],
      dinner: ["Malabar Paratha / Veech Paratha", "Mix Veg Kuruma", "Moli Dosa", "Idly", "Podi", "Coconut Chutney", "Steamed Rice", "Chilli Sambar", "Jeera Dal", "Rasam", "Aloo Capsicum", "Pickle", "Fryums", "Veg Salad", "Banana", "Mutton Gravy", "Chicken Gravy"]
    }
  },
  tuesday: {
    meals: {
      breakfast: ["Bread", "Butter", "Jam", "Idly", "Veg Kosthu", "Special Chutney", "Poha", "Mint Chutney", "Tea / Coffee / Milk", "Masala Omlet (1 Piece)", "Masala Omlet"],
      lunch: ["Millet Sweet", "Ghee Chapathi", "Aloo Mutter Paneer Masala", "Bahara Pulao", "Steamed Rice", "Masala Sambar", "Bagara Dal", "Cabbage Thoran", "Pepper Rasam", "Lauki Subji", "Pickle", "Sambar", "Banana", "Fryums"],
      snacks: ["Boiled Peanut / Black Channa Sundal", "Tea / Coffee"],
      dinner: ["Chapathi", "Navaratna Khurma", "Fried Rice / Noodles", "Pastha", "Manchurian Gravy", "Crispy Vegetable", "Steamed Rice", "Rasam", "Dal Fry", "Pickle", "Fryums", "Veg-Salad", "Milk", "Special Fruits", "Chicken Gravy"]
    }
  },
  wednesday: {
    meals: {
      breakfast: ["Bread", "Butter", "Jam", "Rava Pongal", "Coconut Chutney", "Poori", "Mutter Masala", "Tea / Coffee / Milk"],
      lunch: ["Chapathi", "Soya Kasa", "Jeera Pulav", "Steamed Rice", "Mysore Dal Fry", "Kadi Pakoda", "Garlic Rasam", "Aloo Palak OR Aloo Parwal", "Yam Double Beans Roast", "Pickle", "Fryums", "Butter Milk"],
      snacks: ["Veg Puff / Sweet Bun", "Tea / Coffee"],
      dinner: ["Chapathi", "Steamed Rice", "Dal Tadka", "Chicken Masala / Chilli Chicken", "Paneer Butter Masala", "Rasam", "Pickle", "Fryums", "Veg Salad", "Milk", "Banana", "Chicken Gravy"]
    }
  },
  thursday: {
    meals: {
      breakfast: ["Bread", "Butter", "Jam", "Chapathi", "Dal Masala", "Adiyappam Sevai (Lemon & Masala Flavour)", "Coconut Chutney", "Boiled Egg (1 Piece)", "Banana", "Tea / Coffee", "Boiled Milk"],
      lunch: ["Luchi", "Kashmiri Dum Aloo", "Onion Pulao", "Punjabi Dal Tadka", "Bindi Toriyala", "Steamed Rice", "Kichambali", "Sambar", "Garlic Rasam", "Beetroot Poriyal", "Pickle", "Fryums", "Butter Milk"],
      snacks: ["Pani Poori (or) Mixture", "Tea / Coffee"],
      dinner: ["Ghee Pulao / Kaji Pulao (Basmati Rice)", "Chapathi", "Rava Masala", "Steamed Rice", "Chole Dal Fry", "Rasam", "Aloo Peanut Masala", "Fryums", "Pickle", "Veg Salad", "Milk", "Ice Cream", "Chicken Gravy"]
    }
  },
  friday: {
    meals: {
      breakfast: ["Bread", "Butter", "Jam", "Onion Uthappam", "Idly", "Podi", "Oil", "Chilli Sambar", "Kara Chutney", "Ghee Chapathi", "Aloo Choliya", "Tea / Coffee / Milk", "Boiled Egg (1 Piece)"],
      lunch: ["Special Dry Jamun / Bread Halwa", "Veg Briyani", "Mix Raitha", "Besibelabath", "Curd Rice", "Steamed Rice", "Tomato Rasam", "Aloo Gobi Adaraki", "Moongdal Tadka", "Pickle", "Potato Chips"],
      snacks: ["Bonda / Keera Vada", "Chutney", "Tea / Coffee"],
      dinner: ["Chole Bhatura", "Steamed Rice", "Tomato Dal", "Sambar", "Rava Upma", "Coconut Chutney", "Rasam", "Mixed Veg Poriyal", "Pickle", "Fryums", "Banana", "Veg Salad", "Milk", "Mutton Gravy"]
    }
  },
  saturday: {
    meals: {
      breakfast: ["Bread", "Butter", "Jam", "Chapathi", "Aloo Meal Maker Kasa", "Semiyaa Kichadi", "Coconut Chutney", "Tea / Coffee / Milk", "Boiled Egg (1 Piece)"],
      lunch: ["Poori", "White Peas Masala", "Veg Pulao", "Steamed Rice", "Dal Makhni", "Aloo Tindli", "Vathakuzhambu", "Kootu", "Jeera Rasam", "Pickle", "Special Fryums", "Butter Milk"],
      snacks: ["Cake (or) Brownie / Muffin", "Tea / Coffee"],
      dinner: ["Sweet", "Panjabi Paratha", "Gobi Capsicum", "French Fry", "Steamed Rice", "Mysore Dal Fry", "Veg Idly", "Idly Podi", "Oil", "Chutney", "Tiffen Sambar", "Rasam", "Pickle", "Fryums", "Veg Salad", "Milk", "Special Fruit", "Fish Gravy"]
    }
  },
  sunday: {
    meals: {
      breakfast: ["Bread", "Butter", "Jam", "Chole Poori", "Veg Upma", "Coconut Chutney", "Tea / Coffee / Milk", "Herbal Kanji"],
      lunch: ["Chapathi", "Chicken (Pepper / Kadai)", "Paneer Butter Masala (or) Kadai Paneer", "Dal Dhadka", "Ghee Pulao", "Steamed Rice", "Garlic Rasam", "Poriyal", "Pickle", "Fryums", "Butter Milk", "Chicken Gravy"],
      snacks: ["Corn / Bajji Chutney (OR) Juice", "Tea / Coffee"],
      dinner: ["Variety Stuffing Paratha", "Curd", "Steamed Rice", "Hara Moong Dal Tadka", "Drumstick Sambar", "Poriyal", "Rasam", "Pickle", "Fryums", "Veg Salad", "Milk", "Ice Cream", "Chicken Gravy"]
    }
  }
};

export function getItemId(day: DayOfWeek, meal: MealType, itemName: string): string {
  return `${day}-${meal}-${itemName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}
