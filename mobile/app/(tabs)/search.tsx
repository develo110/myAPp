import { Feather } from "@expo/vector-icons";
import { View, TextInput, ScrollView, Text, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserSearch } from "@/hooks/useUserSearch";
import UserSearchCard from "@/components/UserSearchCard";

const TRENDING_TOPICS = [
  { topic: "#ReactNative", tweets: "125K" },
  { topic: "#TypeScript", tweets: "89K" },
  { topic: "#WebDevelopment", tweets: "234K" },
  { topic: "#AI", tweets: "567K" },
  { topic: "#TechNews", tweets: "98K" },
];

const SearchScreen = () => {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    resultCount,
    isLoading,
    error,
    clearSearch,
    hasSearched,
  } = useUserSearch();

  const renderSearchResult = ({ item }: { item: any }) => (
    <UserSearchCard user={item} />
  );

  const renderEmptySearch = () => (
    <View className="flex-1 items-center justify-center py-8">
      <Feather name="users" size={48} color="#657786" />
      <Text className="text-gray-500 text-lg mt-4 mb-2">No users found</Text>
      <Text className="text-gray-400 text-center px-8">
        Try searching for a different username or name
      </Text>
    </View>
  );

  const renderSearchPrompt = () => (
    <View className="flex-1 items-center justify-center py-8">
      <Feather name="search" size={48} color="#657786" />
      <Text className="text-gray-500 text-lg mt-4 mb-2">Search for people</Text>
      <Text className="text-gray-400 text-center px-8">
        Enter a username, name, or part of a name to find users
      </Text>
    </View>
  );

  const renderDefaultContent = () => (
    <View className="p-4">
      <Text className="text-xl font-bold text-gray-900 mb-4">Trending for you</Text>
      {TRENDING_TOPICS.map((item, index) => (
        <TouchableOpacity key={index} className="py-3 border-b border-gray-100">
          <Text className="text-gray-500 text-sm">Trending in Technology</Text>
          <Text className="font-bold text-gray-900 text-lg">{item.topic}</Text>
          <Text className="text-gray-500 text-sm">{item.tweets} Tweets</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* HEADER */}
      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
          <Feather name="search" size={20} color="#657786" />
          <TextInput
            placeholder="Search people"
            className="flex-1 ml-3 text-base"
            placeholderTextColor="#657786"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} className="ml-2">
              <Feather name="x" size={20} color="#657786" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SEARCH RESULTS */}
      {hasSearched ? (
        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#1DA1F2" />
              <Text className="text-gray-500 mt-4">Searching users...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center py-8">
              <Feather name="alert-circle" size={48} color="#E53E3E" />
              <Text className="text-gray-500 text-lg mt-4 mb-2">Search Error</Text>
              <Text className="text-gray-400 text-center px-8">
                Unable to search users. Please try again.
              </Text>
            </View>
          ) : searchResults.length > 0 ? (
            <>
              <View className="px-4 py-3 border-b border-gray-100">
                <Text className="text-gray-600">
                  {resultCount} {resultCount === 1 ? 'person' : 'people'} found
                </Text>
              </View>
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            </>
          ) : (
            renderEmptySearch()
          )}
        </View>
      ) : (
        <ScrollView className="flex-1">
          {renderDefaultContent()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default SearchScreen;
