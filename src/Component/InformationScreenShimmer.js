import React from 'react';
import { View, ScrollView } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const InformationScreenShimmer = () => {
    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} showsVerticalScrollIndicator={false}>
            {/* Profile Card */}
            <View style={{ width: '100%', paddingHorizontal: 10, marginTop: 15 }}>
                <View style={{
                    flexDirection: 'row',
                    backgroundColor: '#fff',
                    borderRadius: 15,
                    padding: 10,
                    alignItems: 'center',
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                }}>
                    {/* Profile Image Placeholder */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{ width: 60, height: 60, borderRadius: 60 }}
                    />

                    {/* Name & Phone Placeholder */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '70%', height: 16, borderRadius: 4, marginBottom: 8 }}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '50%', height: 14, borderRadius: 4 }}
                        />
                    </View>

                    {/* Right side: Switch + 3-dots + call/whatsapp icons (small placeholders) */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {/* Call icon placeholder */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: 20, height: 20, borderRadius: 10 }}
                        />
                        {/* WhatsApp icon placeholder */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: 20, height: 20, borderRadius: 10 }}
                        />
                        {/* Switch placeholder */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: 45, height: 25, borderRadius: 15 }}
                        />
                        {/* Three-dot menu placeholder */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: 30, height: 30, borderRadius: 10 }}
                        />
                    </View>
                </View>
            </View>

            {/* Details Section Card */}
            <View style={{ backgroundColor: '#fff', width: '100%', paddingHorizontal: 10, marginTop: 15 }}>
                <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 15,
                    padding: 15,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 4,
                    elevation: 2,
                }}>
                    {/* 5 Detail Rows */}
                    {[1, 2, 3, 4, 5].map((_, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: i < 4 ? 1 : 0, borderColor: '#eee' }}>
                            {/* Icon placeholder */}
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: 26, height: 26, borderRadius: 6 }}
                            />
                            {/* Label and value placeholders */}
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <ShimmerPlaceholder
                                    LinearGradient={LinearGradient}
                                    style={{ width: '40%', height: 14, borderRadius: 4, marginBottom: 5 }}
                                />
                                <ShimmerPlaceholder
                                    LinearGradient={LinearGradient}
                                    style={{ width: '80%', height: 14, borderRadius: 4 }}
                                />
                            </View>
                            {/* In the last row (Account Status) there could be an "Extend" button, so add a small placeholder if needed */}
                            {i === 4 && (
                                <ShimmerPlaceholder
                                    LinearGradient={LinearGradient}
                                    style={{ width: 70, height: 35, borderRadius: 20, marginLeft: 10 }}
                                />
                            )}
                        </View>
                    ))}
                </View>
            </View>

            {/* History Tabs Section */}
            <View style={{ width: '100%', paddingHorizontal: 12, marginTop: 20 }}>
                <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 18,
                    paddingVertical: 20,
                    paddingHorizontal: 10,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 8,
                    elevation: 4,
                }}>
                    {/* Horizontal tab buttons */}
                    <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: 130, height: 36, borderRadius: 20, marginRight: 10 }}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: 140, height: 36, borderRadius: 20 }}
                        />
                    </View>

                    {/* Divider line */}
                    <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 15, marginHorizontal: 10 }} />

                    {/* History List Placeholder (simulating Search History items) */}
                    <View style={{ backgroundColor: '#F9FAFB', paddingVertical: 20, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
                        {/* 3 placeholder items */}
                        {[1, 2, 3].map((_, idx) => (
                            <View key={idx} style={{ backgroundColor: '#fff', padding: 12, marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                {/* Top row with index, reg no, and info icon */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 30, height: 16, borderRadius: 4 }} />
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 16, height: 16, borderRadius: 4, marginRight: 5 }} />
                                        <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 80, height: 14, borderRadius: 4 }} />
                                    </View>
                                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 20, height: 20, borderRadius: 10 }} />
                                </View>
                                {/* Chassis no placeholder (optional) */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 16, height: 16, borderRadius: 4, marginRight: 6 }} />
                                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 150, height: 14, borderRadius: 4 }} />
                                </View>
                                {/* Date placeholder */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 16, height: 16, borderRadius: 4, marginRight: 6 }} />
                                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 120, height: 14, borderRadius: 4 }} />
                                </View>
                                {/* Location placeholder */}
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 16, height: 16, borderRadius: 4, marginRight: 6 }} />
                                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 180, height: 14, borderRadius: 4 }} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Extra bottom padding */}
            <View style={{ height: 20 }} />
        </ScrollView>
    );
};

export default InformationScreenShimmer;