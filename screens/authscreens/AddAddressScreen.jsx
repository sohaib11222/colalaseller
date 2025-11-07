// screens/store/AddAddressScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

const { height } = Dimensions.get("window");

//Code Related to the integration
import { setAddress, updateAddress } from "../../utils/mutations/seller";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { getOnboardingToken } from "../../utils/tokenStorage";

// Demo lists — replace with API data
const STATES = [
  "Abia State",
  "Adamawa State",
  "Akwa Ibom State",
  "Anambra State",
  "Bauchi State",
  "Bayelsa State",
  "Benue State",
  "Borno State",
  "Cross River State",
  "Delta State",
  "Ebonyi State",
  "Edo State",
  "Ekiti State",
  "Enugu State",
  "FCT, Abuja",
  "Gombe State",
  "Imo State",
  "Jigawa State",
  "Kaduna State",
  "Kano State",
  "Katsina State",
  "Kebbi State",
  "Kogi State",
  "Kwara State",
  "Lagos State",
  "Nasarawa State",
  "Niger State",
  "Ogun State",
  "Ondo State",
  "Osun State",
  "Oyo State",
  "Plateau State",
  "Rivers State",
  "Sokoto State",
  "Taraba State",
  "Yobe State",
  "Zamfara State",
];
const LGAS = {
  "Abia State": ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu Nneochi"],
  "Adamawa State": ["Demsa", "Fufure", "Ganye", "Girei", "Gombi", "Guyuk", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"],
  "Akwa Ibom State": ["Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"],
  "Anambra State": ["Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"],
  "Bauchi State": ["Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Toro", "Warji", "Zaki"],
  "Bayelsa State": ["Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"],
  "Benue State": ["Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Otukpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"],
  "Borno State": ["Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"],
  "Cross River State": ["Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"],
  "Delta State": ["Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"],
  "Ebonyi State": ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Ohaozara", "Ohaukwu", "Onicha"],
  "Edo State": ["Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba Okha", "Oredo", "Orhionmwon", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"],
  "Ekiti State": ["Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"],
  "Enugu State": ["Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo Uwani"],
  "FCT, Abuja": ["Abaji", "Bwari", "Gwagwalada", "Kuje", "Municipal Area Council", "Kwali"],
  "Gombe State": ["Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"],
  "Imo State": ["Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West", "Unuimo"],
  "Jigawa State": ["Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kazaure", "Kiri Kasama", "Kiyawa", "Kaugama", "Maigatari", "Malam Madori", "Miga", "Ringim", "Roni", "Sule Tankarkar", "Taura", "Yankwashi"],
  "Kaduna State": ["Birnin Gwari", "Chikun", "Giwa", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"],
  "Kano State": ["Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nasarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"],
  "Katsina State": ["Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", "Danja", "Dan Musa", "Daura", "Dutsi", "Dutsin Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"],
  "Kebbi State": ["Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru"],
  "Kogi State": ["Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa Muro", "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"],
  "Kwara State": ["Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", "Pategi"],
  "Lagos State": ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"],
  "Nasarawa State": ["Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"],
  "Niger State": ["Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Moya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"],
  "Ogun State": ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Egbado North", "Egbado South", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Shagamu", "Yewa North", "Yewa South"],
  "Ondo State": ["Akoko North-East", "Akoko North-West", "Akoko South-West", "Akoko South-East", "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"],
  "Osun State": ["Atakunmosa East", "Atakunmosa West", "Aiyedaade", "Aiyedire", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Ife Central", "Ife East", "Ife North", "Ife South", "Egbedore", "Ejigbo", "Ifedayo", "Ifelodun", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin", "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"],
  "Oyo State": ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomoso North", "Ogbomoso South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo", "Oyo East", "Saki East", "Saki West", "Surulere"],
  "Plateau State": ["Bokkos", "Barkin Ladi", "Bassa", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"],
  "Rivers State": ["Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Eleme", "Emuoha", "Etche", "Gokana", "Ikwerre", "Khana", "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai"],
  "Sokoto State": ["Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"],
  "Taraba State": ["Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kumi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"],
  "Yobe State": ["Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"],
  "Zamfara State": ["Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Chafe", "Zurmi"],
};

const TIME_OPTIONS = [
  "Closed",
  "06:00 AM",
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
  "11:00 PM",
];

function InlineHeader({ title, onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
        <Ionicons name="chevron-back" size={22} />
      </TouchableOpacity>
      <ThemedText style={styles.headerTitle}>{title}</ThemedText>
      <View style={styles.headerBtn} />
    </View>
  );
}

function RowSelector({ label, value, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <ThemedText style={[styles.rowText, value && { color: "#101318" }]}>
        {value || label}
      </ThemedText>
      <Ionicons name="chevron-forward" size={20} color="#9AA0A6" />
    </TouchableOpacity>
  );
}

function TimeRow({ day, from, to, onChange }) {
  return (
    <View style={styles.timeRow}>
      <ThemedText style={{ width: 84 }}>{day}</ThemedText>
      <TouchableOpacity
        style={styles.timePicker}
        onPress={() => onChange("from")}
      >
        <ThemedText style={styles.timeText}>{from || "From"}</ThemedText>
        <Ionicons name="chevron-down" size={16} color="#9AA0A6" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.timePicker}
        onPress={() => onChange("to")}
      >
        <ThemedText style={styles.timeText}>{to || "To"}</ThemedText>
        <Ionicons name="chevron-down" size={16} color="#9AA0A6" />
      </TouchableOpacity>
    </View>
  );
}

export default function AddAddressScreen() {
  const { theme } = useTheme();
  const nav = useNavigation();
  const route = useRoute();
  const onSaved = route.params?.onSaved;
  const editData = route.params?.editData;
  const { token } = useAuth();
  
  // Check if we're in edit mode
  const isEditMode = !!editData;
  
  // Get onboarding token from storage
  const [onboardingToken, setOnboardingToken] = useState(null);
  
  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await getOnboardingToken();
        setOnboardingToken(token);
        console.log("Retrieved onboarding token:", token ? "Token present" : "No token");
      } catch (error) {
        console.error("Error getting onboarding token:", error);
        setOnboardingToken(null);
      }
    };
    getToken();
  }, []);

  // Use onboarding token if available, otherwise use auth token
  const authToken = onboardingToken || token;

  const [stateName, setStateName] = useState(editData?.state || "");
  const [lga, setLga] = useState(editData?.local_government || "");
  const [fullAddress, setFullAddress] = useState(editData?.full_address || "");

  // Function to parse opening hours from API format
  const parseOpeningHours = (apiHours) => {
    if (!apiHours || typeof apiHours !== 'object') {
      return {
        Monday: { from: "", to: "" },
        Tuesday: { from: "", to: "" },
        Wednesday: { from: "", to: "" },
        Thursday: { from: "", to: "" },
        Friday: { from: "", to: "" },
        Saturday: { from: "", to: "" },
        Sunday: { from: "", to: "" },
      };
    }

    const dayMapping = {
      monday: "Monday",
      tuesday: "Tuesday", 
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday"
    };

    const parsedHours = {
      Monday: { from: "", to: "" },
      Tuesday: { from: "", to: "" },
      Wednesday: { from: "", to: "" },
      Thursday: { from: "", to: "" },
      Friday: { from: "", to: "" },
      Saturday: { from: "", to: "" },
      Sunday: { from: "", to: "" },
    };

    Object.keys(apiHours).forEach(day => {
      const dayHours = apiHours[day];
      const dayName = dayMapping[day.toLowerCase()];
      
      if (dayName && dayHours) {
        if (typeof dayHours === 'string') {
          // Format: "06:00 AM-06:00 AM" or "9:00-18:00"
          const [from, to] = dayHours.split('-');
          parsedHours[dayName] = {
            from: from?.trim() || "",
            to: to?.trim() || ""
          };
        } else if (dayHours.from && dayHours.to) {
          // Format: {from: "9:00", to: "18:00"}
          parsedHours[dayName] = {
            from: dayHours.from,
            to: dayHours.to
          };
        }
      }
    });

    return parsedHours;
  };

  const [hours, setHours] = useState(parseOpeningHours(editData?.opening_hours));
  const [main, setMain] = useState(editData?.is_main || false);

  const [stateSheet, setStateSheet] = useState(false);
  const [lgaSheet, setLgaSheet] = useState(false);
  const [timeSheet, setTimeSheet] = useState(false);
  const [search, setSearch] = useState("");
  const [lgaSearch, setLgaSearch] = useState("");
  const [currentTimeEdit, setCurrentTimeEdit] = useState({
    day: "",
    which: "",
  });

  const filteredStates = useMemo(
    () => STATES.filter((s) => s.toLowerCase().includes(search.toLowerCase())),
    [search]
  );
  const filteredLGAs = useMemo(() => {
    const list = LGAS[stateName] || [];
    return list.filter((x) =>
      x.toLowerCase().includes(lgaSearch.toLowerCase())
    );
  }, [stateName, lgaSearch]);

  // Set Address Mutation (for creating new addresses)
  const setAddressMutation = useMutation({
    mutationFn: (payload) => {
      console.log("Creating new address with token:", authToken ? "Token present" : "No token");
      console.log("Payload:", payload);
      return setAddress(payload, authToken);
    },
    onSuccess: (data) => {
      console.log("Address created successfully:", data);
      if (data.status === true) {
        // Call the onSaved callback if provided
        onSaved?.(data);
        // Navigate back to the previous screen
        nav.goBack();
      }
    },
    onError: (error) => {
      console.error("Create address error:", error);
      console.error("Token status:", authToken ? "Token present" : "No token");
      // You can add error handling here (Alert, toast, etc.)
    },
  });

  // Update Address Mutation (for updating existing addresses)
  const updateAddressMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      console.log("Updating address with ID:", id);
      console.log("Token:", authToken ? "Token present" : "No token");
      console.log("Payload:", payload);
      return updateAddress(id, payload, authToken);
    },
    onSuccess: (data) => {
      console.log("Address updated successfully:", data);
      if (data.status === true) {
        // Call the onSaved callback if provided
        onSaved?.(data);
        // Navigate back to the previous screen
        nav.goBack();
      }
    },
    onError: (error) => {
      console.error("Update address error:", error);
      console.error("Token status:", authToken ? "Token present" : "No token");
      // You can add error handling here (Alert, toast, etc.)
    },
  });

  // Check if form is complete
  const isFormComplete = stateName && lga && fullAddress.trim();
  
  // Debug form completion
  console.log("Form validation:", {
    stateName: !!stateName,
    lga: !!lga,
    fullAddress: !!fullAddress.trim(),
    isFormComplete,
    authToken: !!authToken
  });

  // Format hours for API
  const formatHoursForAPI = (hours) => {
    const formattedHours = [];
    
    // Helper function to convert 12-hour format to 24-hour format
    const convertTo24Hour = (timeStr) => {
      if (!timeStr) return "";
      
      // If already in 24-hour format (HH:MM), return as is
      if (!timeStr.includes("AM") && !timeStr.includes("PM")) {
        return timeStr;
      }
      
      const [time, period] = timeStr.split(" ");
      const [hours, minutes] = time.split(":");
      let hour24 = parseInt(hours);
      
      if (period === "AM") {
        if (hour24 === 12) hour24 = 0;
      } else if (period === "PM") {
        if (hour24 !== 12) hour24 += 12;
      }
      
      return `${hour24.toString().padStart(2, '0')}:${minutes}`;
    };
    
    Object.keys(hours).forEach((day) => {
      const dayHours = hours[day];
      const dayKey = day.toLowerCase();
      
      // Only include days that are actually open (not closed)
      const isOpen = dayHours.from && dayHours.to && 
                    dayHours.from !== "Closed" && dayHours.to !== "Closed";
      
      if (isOpen) {
        // Send open day with times
        formattedHours.push({
          day: dayKey,
          open_time: convertTo24Hour(dayHours.from),
          close_time: convertTo24Hour(dayHours.to)
        });
      }
      // Skip closed days entirely - don't send them to the backend
    });
    return formattedHours;
  };

  const save = () => {
    if (!isFormComplete) return;
    
    // Check if token is available
    if (!authToken) {
      console.error("No authentication token available");
      return;
    }
    
    const payload = {
      state: stateName,
      local_government: lga,
      full_address: fullAddress.trim(),
      is_main: main,
      opening_hours: formatHoursForAPI(hours),
    };

    console.log("Save payload:", payload);
    
    if (isEditMode && editData?.id) {
      // Use update mutation for edit mode
      console.log("Edit mode - Address ID:", editData.id);
      updateAddressMutation.mutate({ id: editData.id, payload });
    } else {
      // Use create mutation for new addresses
      console.log("Create mode - New address");
      setAddressMutation.mutate(payload);
    }
  };

  const setTime = (day, which) => {
    setCurrentTimeEdit({ day, which });
    setTimeSheet(true);
  };

  const selectTime = (time) => {
    const { day, which } = currentTimeEdit;
    setHours((h) => ({ ...h, [day]: { ...h[day], [which]: time } }));
    setTimeSheet(false);
  };

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="dark" />
      <InlineHeader title={isEditMode ? "Edit Address" : "Add New Address"} onBack={() => nav.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        <RowSelector
          label="State"
          value={stateName}
          onPress={() => {
            setSearch("");
            setStateSheet(true);
          }}
        />
        <RowSelector
          label="Local Government"
          value={lga}
          onPress={() => {
            if (!stateName) return;
            setLgaSearch("");
            setLgaSheet(true);
          }}
        />
        <View style={styles.addressBox}>
          <TextInput
            value={fullAddress}
            onChangeText={setFullAddress}
            placeholder="Enter full address"
            style={{ padding: 12, minHeight: 112 }}
            multiline
          />
        </View>

        <ThemedText
          style={{ marginTop: 12, marginBottom: 8, color: "#6F7683" }}
        >
          Opening Hours
        </ThemedText>
        {Object.keys(hours).map((d) => (
          <TimeRow
            key={d}
            day={d}
            from={hours[d].from}
            to={hours[d].to}
            onChange={(which) => setTime(d, which)}
          />
        ))}

        {/* Mark as Main Store — tap row to toggle, red dot like screenshot */}
        <TouchableOpacity
          style={styles.mainRow}
          onPress={() => setMain((m) => !m)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={[
                styles.redDot,
                main ? styles.redDotFilled : styles.redDotHollow,
              ]}
            />
            <ThemedText>Mark as Main Store</ThemedText>
          </View>
          <Ionicons
            name={main ? "checkmark-circle" : "ellipse-outline"}
            size={20}
            color={main ? theme.colors.primary : "#9AA0A6"}
          />
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.saveBtn, 
          { 
            backgroundColor: isFormComplete && !setAddressMutation.isPending && !updateAddressMutation.isPending
              ? theme.colors.primary 
              : "#CCCCCC" 
          }
        ]}
        onPress={save}
        activeOpacity={0.9}
        disabled={!isFormComplete || setAddressMutation.isPending || updateAddressMutation.isPending}
      >
        {(setAddressMutation.isPending || updateAddressMutation.isPending) ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
              {isEditMode ? "Updating..." : "Saving..."}
            </ThemedText>
          </View>
        ) : (
          <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
            {isEditMode ? "Update" : "Save"} {!isFormComplete ? "(Incomplete)" : ""}
          </ThemedText>
        )}
      </TouchableOpacity>

      {/* STATE SHEET */}
      <Modal visible={stateSheet} transparent animationType="slide">
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>Location</ThemedText>
              <TouchableOpacity
                onPress={() => setStateSheet(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={16} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Search location"
              value={search}
              onChangeText={setSearch}
              style={styles.search}
            />

            <ThemedText style={styles.sectionLabel}>Popular</ThemedText>
            {["Lagos State", "Oyo State", "FCT , Abuja", "Rivers State"].map(
              (p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.option}
                  onPress={() => {
                    setStateName(p);
                    setLga("");
                    setStateSheet(false);
                  }}
                >
                  <ThemedText>{p}</ThemedText>
                </TouchableOpacity>
              )
            )}

            <ThemedText style={styles.sectionLabel}>All States</ThemedText>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredStates.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.option}
                  onPress={() => {
                    setStateName(s);
                    setLga("");
                    setStateSheet(false);
                  }}
                >
                  <ThemedText>{s}</ThemedText>
                </TouchableOpacity>
              ))}
              <View style={{ height: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* LGA SHEET (with search, same look) */}
      <Modal visible={lgaSheet} transparent animationType="slide">
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>
                Local Government
              </ThemedText>
              <TouchableOpacity
                onPress={() => setLgaSheet(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={16} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Search LGA"
              value={lgaSearch}
              onChangeText={setLgaSearch}
              style={styles.search}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredLGAs.map((x) => (
                <TouchableOpacity
                  key={x}
                  style={styles.option}
                  onPress={() => {
                    setLga(x);
                    setLgaSheet(false);
                  }}
                >
                  <ThemedText>{x}</ThemedText>
                </TouchableOpacity>
              ))}
              <View style={{ height: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* TIME PICKER SHEET */}
      <Modal visible={timeSheet} transparent animationType="slide">
        <View style={styles.sheetWrap}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            onPress={() => setTimeSheet(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>
                Select{" "}
                {currentTimeEdit.which === "from" ? "Opening" : "Closing"} Time
              </ThemedText>
              <TouchableOpacity
                onPress={() => setTimeSheet(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={16} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sheetList}>
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.option,
                    hours[currentTimeEdit.day]?.[currentTimeEdit.which] ===
                      time && {
                      backgroundColor: theme.colors.primary + "20",
                      borderWidth: 1,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => selectTime(time)}
                >
                  <ThemedText
                    style={[
                      styles.sheetItemText,
                      hours[currentTimeEdit.day]?.[currentTimeEdit.which] ===
                        time && {
                        color: theme.colors.primary,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {time}
                  </ThemedText>
                  {hours[currentTimeEdit.day]?.[currentTimeEdit.which] ===
                    time && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={theme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
              <View style={{ height: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F7FB" },

  /* header */
  header: {
    height: 80,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 30,
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },

  row: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },
  rowText: { fontSize: 15, color: "#9AA0A6" },

  addressBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF0F6",
    minHeight: 112,
    marginBottom: 12,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  timePicker: {
    flex: 1,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF0F6",
    marginHorizontal: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeText: { color: "#101318" },

  mainRow: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  redDotFilled: { backgroundColor: "#E83B3B" },
  redDotHollow: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E83B3B",
  },

  saveBtn: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 22,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  /* bottom sheet styles */
  sheetWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: height * 0.9,
    padding: 16,
  },
  dragHandle: {
    width: 120,
    height: 8,
    borderRadius: 100,
    backgroundColor: "#D9D9D9",
    alignSelf: "center",
    marginTop: -4,
    marginBottom: 6,
  },
  sheetHeader: {
    paddingTop: 4,
    paddingBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { fontSize: 18, fontStyle: "italic", fontWeight: "600" },
  closeBtn: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 28,
    height: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    backgroundColor: "#F0F0F0",
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    fontSize: 15,
  },
  option: {
    backgroundColor: "#EFEFEF",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  sectionLabel: {
    marginTop: 14,
    marginBottom: 6,
    fontWeight: "700",
  },

  /* time picker styles */
  sheetList: {
    maxHeight: 400,
  },
  sheetItemText: {
    fontSize: 16,
    color: "#101318",
    fontWeight: "500",
  },
});
