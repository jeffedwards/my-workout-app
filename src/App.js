import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
// CHANGED: Removed unused 'signInWithCustomToken'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'; 
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- Firebase Configuration ---
// This should be your actual Firebase config object.
const firebaseConfig = {
  apiKey: "AIzaSyAM9SCWtcgXCXitaSpMu4BSIUDLqc8ik30", // Example, ensure this is your actual key
  authDomain: "gym-app-8d473.firebaseapp.com",    // Example, ensure this is your actual domain
  projectId: "gym-app-8d473",                    // Example, ensure this is your actual project ID
  storageBucket: "gym-app-8d473.appspot.com",    // Example, ensure this is your actual storage bucket
  messagingSenderId: "272524065843",             // Example, ensure this is your actual sender ID
  appId: "1:272524065843:web:51fef9c1e9c5f8dea3f746", // Example, ensure this is your actual app ID
  measurementId: "G-609L5CRKYY"                  // Example, ensure this is your actual measurement ID (optional)
};

// --- Global Firebase Variables ---
const appId = 'default-workout-app'; 
const effectiveFirebaseConfig = firebaseConfig;

// Initialize Firebase
const app = initializeApp(effectiveFirebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Helper Icons (Inline SVGs for simplicity) ---
const CheckIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

const PlayIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
  </svg>
);

const PauseIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm3 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd"></path>
  </svg>
);

const StopIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 00-1 1v1a1 1 0 001 1h4a1 1 0 001-1v-1a1 1 0 00-1-1H8z" clipRule="evenodd"></path>
  </svg>
);

const ChevronLeftIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
  </svg>
);

// --- Workout Data (Parsed from CSV) ---
const WORKOUT_PROGRAM_DATA = [
    // Phase 1, Week 1
    { phase: "Phase 1", week: "Week 1", workoutNumber: "Workout 1", focus: "Chest, Triceps, Abs", jointType: "Multi-Joint", exercises: [
        { name: "Bench Press", sets: 4, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Decline Smith Machine Press", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Dips", sets: 4, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Close-Grip Bench Press", sets: 4, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Cable Crunch", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Smith Machine Hip Thrust", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
    ]},
    { phase: "Phase 1", week: "Week 1", workoutNumber: "Workout 2", focus: "Shoulders, Legs, Calves", jointType: "Multi-Joint", exercises: [
        { name: "Barbell Shoulder Press", sets: 4, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Alternating Dumbbell Shoulder Press (Standing)", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Smith Machine One-Arm Upright Row", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Squat", sets: 4, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Deadlift", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Walking Lunge", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Standing Calf Raise", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Seated Calf Raise", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
    ]},
    { phase: "Phase 1", week: "Week 1", workoutNumber: "Workout 3", focus: "Back, Traps, Biceps", jointType: "Multi-Joint", exercises: [
        { name: "Barbell Bent Over Row", sets: 4, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Dumbbell Bent-Over Row", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Seated Cable Row", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Barbell Shrug", sets: 4, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Barbell Curl", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Barbell or EZ-Bar Preacher Curl", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Reverse-Grip Barbell Curl", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
        { name: "Barbell Wrist Curl", sets: 3, reps: "9-11", cardio: "20 seconds", notes: "" },
    ]},
    // Phase 1, Week 2
    { phase: "Phase 1", week: "Week 2", workoutNumber: "Workout 1", focus: "Chest, Triceps, Abs", jointType: "Multi-Joint", exercises: [
        { name: "Bench Press", sets: 4, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Decline Smith Machine Press", sets: 3, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Dips", sets: 4, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Close-Grip Bench Press", sets: 4, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Cable Crunch", sets: 3, reps: "7-8", cardio: "30 seconds", notes: "" },
        { name: "Smith Machine Hip Thrust", sets: 3, reps: "7-8", cardio: "30 seconds", notes: "" },
    ]},
    { phase: "Phase 1", week: "Week 2", workoutNumber: "Workout 2", focus: "Shoulders, Legs, Calves", jointType: "Multi-Joint", exercises: [
        { name: "Barbell Shoulder Press", sets: 4, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Alternating Dumbbell Shoulder Press (Standing)", sets: 3, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Smith Machine One-Arm Upright Row", sets: 3, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Squat", sets: 4, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Deadlift", sets: 3, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Walking Lunge", sets: 3, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Standing Calf Raise", sets: 3, reps: "7-8", cardio: "30 seconds", notes: "" },
        { name: "Seated Calf Raise", sets: 3, reps: "7-8", cardio: "30 seconds", notes: "" },
    ]},
    { phase: "Phase 1", week: "Week 2", workoutNumber: "Workout 3", focus: "Back, Traps, Biceps", jointType: "Multi-Joint", exercises: [
        { name: "Barbell Bent Over Row", sets: 4, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Dumbbell Bent-Over Row", sets: 3, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Seated Cable Row", sets: 3, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Barbell Shrug", sets: 4, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Barbell Curl", sets: 3, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Barbell or EZ-Bar Preacher Curl", sets: 3, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Reverse-Grip Barbell Curl", sets: 3, reps: "6-8", cardio: "30 seconds", notes: "" },
        { name: "Barbell Wrist Curl", sets: 3, reps: "6-8", cardio: "30 seconds", notes: "" },
    ]},
    { phase: "Phase 1", week: "Week 2", workoutNumber: "Workout 4", focus: "Chest, Triceps, Abs", jointType: "Single Joint", exercises: [
        { name: "Incline Dumbbell Flye", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Dumbbell Flye", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Cable Crossover", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Triceps Pressdown", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Overhead Dumbbell Extension", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Cable Lying Triceps Extension", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Crunch", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Standing Oblique Cable Crunch", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
    ]},
    { phase: "Phase 1", week: "Week 2", workoutNumber: "Workout 5", focus: "Shoulders, Legs, Calves", jointType: "Single Joint", exercises: [
        { name: "Dumbbell Lateral Raise", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Barbell Front Raise", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Dumbbell Bent-Over Lateral Raise", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Leg Extension", sets: 4, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Leg Curl", sets: 4, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Seated Calf Raise", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Donkey or Leg Press Calf Raise", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
    ]},
    { phase: "Phase 1", week: "Week 2", workoutNumber: "Workout 6", focus: "Back, Traps, Biceps", jointType: "Single Joint", exercises: [
        { name: "Lat Pulldown", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Reverse-Grip Pulldown", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Straight-Arm Pulldown.", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Smith Machine Behind-the-Back Shrug", sets: 4, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Incline Dumbbell Curi", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" }, 
        { name: "High Cable Curl", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
        { name: "Rope Cable Curl", sets: null, reps: "12-15", cardio: "30 seconds", notes: "Sets not listed in source" },
        { name: "Dumbbell Reverse Wrist Curl", sets: 3, reps: "12-15", cardio: "30 seconds", notes: "" },
    ]},
    // Phase 1, Week 3
    { phase: "Phase 1", week: "Week 3", workoutNumber: "Workout 1", focus: "Chest, Triceps, Abs", jointType: "Multi-Joint", exercises: [
        { name: "Bench Press", sets: 4, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Decline Smith Machine Press", sets: 3, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Dips", sets: 4, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Close-Grip Bench Press", sets: 4, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Cable Crunch", sets: 3, reps: "5-6", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Smith Machine Hip Thrust", sets: 3, reps: "5-6", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
    ]},
    { phase: "Phase 1", week: "Week 3", workoutNumber: "Workout 2", focus: "Shoulders, Legs, Calves", jointType: "Multi-Joint", exercises: [
        { name: "Barbell Shoulder Press", sets: 4, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Alternating Dumbbell Shoulder Press (Standing)", sets: 3, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Smith Machine One-Arm Upright Row", sets: 3, reps: "4-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Squat", sets: 4, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Deadlift", sets: 3, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Walking Lunge", sets: 3, reps: "4-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Standing Calf Raise", sets: 3, reps: "5-6", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Seated Calf Raise", sets: 3, reps: "5-6", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
    ]},
    { phase: "Phase 1", week: "Week 3", workoutNumber: "Workout 3", focus: "Back, Traps, Biceps", jointType: "Multi-Joint", exercises: [
        { name: "Barbell Bent Over Row", sets: 4, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Dumbbell Bent-Over Row", sets: 3, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Seated Cable Row", sets: 3, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Barbell Shrug", sets: 4, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Barbell Curl", sets: 3, reps: "2-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Barbell or EZ-Bar Preacher Curl", sets: 3, reps: "4-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Reverse-Grip Barbell Curl", sets: 3, reps: "4-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
        { name: "Barbell Wrist Curl", sets: 3, reps: "4-5", cardio: "40 seconds", notes: "On the last set do a cardio accelerated rest-pause dropset" },
    ]},
    { phase: "Phase 1", week: "Week 3", workoutNumber: "Workout 4", focus: "Chest, Triceps, Abs", jointType: "Single Joint", exercises: [
        { name: "Incline Dumbbell Flye", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Dumbbell Flye", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Cable Crossover", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Triceps Pressdown", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Overhead Dumbbell Extension", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Cable Lying Triceps Extension", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Crunch", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Standing Oblique Cable Crunch", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
    ]},
    { phase: "Phase 1", week: "Week 3", workoutNumber: "Workout 5", focus: "Shoulders, Legs, Calves", jointType: "Single Joint", exercises: [
        { name: "Dumbbell Lateral Raise", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Barbell Front Raise", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Dumbbell Bent-Over Lateral Raise", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Leg Extension", sets: 4, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Leg Curl", sets: 4, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Seated Calf Raise", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Donkey or Leg Press Calf Raise", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
    ]},
    { phase: "Phase 1", week: "Week 3", workoutNumber: "Workout 6", focus: "Back, Traps, Biceps", jointType: "Single Joint", exercises: [
        { name: "Lat Pulldown", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Reverse-Grip Pulldown", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Straight-Arm Pulldown", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Smith Machine Behind-the-Back Shrug", sets: 4, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Incline Dumbbell Curl", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "High Cable Curl", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Rope Cable Curl", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
        { name: "Dumbbell Reverse Wrist Curl", sets: 3, reps: "16-20", cardio: "50 seconds", notes: "" },
    ]},
    // Phase 2, Week 4
    { phase: "Phase 2", week: "Week 4", workoutNumber: "Workout 1", focus: "Chest, Triceps, Abs", jointType: "Multi-Joint", exercises: [
        { name: "Bench Press", sets: 4, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Incline Bench Press", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Decline Dumbbell Press", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dips", sets: 4, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Close-Grip Bench Press", sets: 4, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Smith Machine Crunch", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Hanging Leg Raise", sets: null, reps: "9-11", cardio: "60 seconds", notes: "Sets not listed in source" },
    ]},
    { phase: "Phase 2", week: "Week 4", workoutNumber: "Workout 2", focus: "Shoulders, Legs, Calves", jointType: "Multi-Joint", exercises: [
        { name: "Barbell Shoulder Press", sets: 4, reps: "9-11", cardio: "60 seconds", notes: "" },
        { name: "Dumbbell Shoulder Press (Seated)", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Upright Row", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Squat", sets: 4, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Deadlift", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Leg Press", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Standing Calf Raise", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Seated Calf Raise", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
    { phase: "Phase 2", week: "Week 4", workoutNumber: "Workout 3", focus: "Back, Traps, Biceps", jointType: "Multi-Joint", exercises: [
        { name: "Barbell Bent Over Row", sets: 4, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Incline Dumbbell Row", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Seated Cable Row.", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Barbell Shrug", sets: 4, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Barbell Curl", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Seated Barbell Curl", sets: null, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Reverse-Grip Barbell or EZ-Bar Curl", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Behind-The-Back Wrist Curl", sets: 3, reps: "9-11", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
    { phase: "Phase 2", week: "Week 4", workoutNumber: "Workout 4", focus: "Chest, Triceps, Abs", jointType: "Single Joint", exercises: [
        { name: "Cable Crossover from Low Pulley", sets: 4, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Cable Crossover", sets: null, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Flye", sets: 3, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Overhead Cable Triceps Extension", sets: null, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Lying Triceps Extension", sets: 3, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Rope Triceps Pressdown", sets: null, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Crossover Crunch", sets: 3, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Cable Woodchopper", sets: null, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
    { phase: "Phase 2", week: "Week 4", workoutNumber: "Workout 5", focus: "Shoulders, Legs, Calves", jointType: "Single Joint", exercises: [
        { name: "Dumbbell Lateral Raise", sets: 4, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Cable Front Raise", sets: null, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Lying Cable Rear Delt Flye", sets: null, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Leg Extension", sets: 4, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Leg Curl", sets: 4, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Seated Calf Raise", sets: null, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Donkey or Leg Press Calf Raise", sets: null, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
    { phase: "Phase 2", week: "Week 4", workoutNumber: "Workout 6", focus: "Back, Traps, Biceps", jointType: "Single Joint", exercises: [
        { name: "Lat Pulldown", sets: 4, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Behind-the-Neck Pulldown", sets: null, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Rope Straight-Arm Pulldown", sets: 3, reps: "12-15", cardio: "60 seconds", notes: "" },
        { name: "Dumbbell Shrug", sets: 4, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "EZ-Bar Cable Curl", sets: 3, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Incline Dumbbell Curl", sets: 3, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Hammer Curl", sets: 3, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Reverse Wrist Curl", sets: 3, reps: "12-15", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
     // Phase 2, Week 5
    { phase: "Phase 2", week: "Week 5", workoutNumber: "Workout 1", focus: "Chest, Triceps, Abs", jointType: "Multi-Joint", exercises: [
        { name: "Bench Press", sets: 4, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Incline Bench Press", sets: 3, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Decline Dumbbell Press", sets: 3, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dips", sets: 4, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "CloseGrip -Bench Press", sets: 4, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" }, 
        { name: "Smith Machine Crunch", sets: 3, reps: "7-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Hanging Leg Raise^", sets: 3, reps: "7-8", cardio: "60 seconds", notes: "Use ankle weights or hold dumbbell between feet if needed" },
    ]},
    { phase: "Phase 2", week: "Week 5", workoutNumber: "Workout 2", focus: "Shoulders, Legs, Calves", jointType: "Multi-Joint", exercises: [
        { name: "Barbell Shoulder Press", sets: 4, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Shoulder Press (Seated)", sets: 3, reps: "6-8", cardio: "60 seconds", notes: "" },
        { name: "Dumbbell Upright Row", sets: 3, reps: "6-8", cardio: "60 seconds", notes: "" },
        { name: "Squat", sets: 4, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Deadlift", sets: 3, reps: "6-8", cardio: "60 seconds", notes: "" },
        { name: "Leg Press", sets: 3, reps: "6-8", cardio: "60 seconds", notes: "" },
        { name: "Standing Calf Raise", sets: 3, reps: "7-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Seated Calf Raise", sets: 3, reps: "7-8", cardio: "60 seconds", notes: "" },
    ]},
    { phase: "Phase 2", week: "Week 5", workoutNumber: "Workout 3", focus: "Back, Traps, Biceps", jointType: "Multi-Joint", exercises: [
        { name: "Barbell Bent Over Row", sets: 4, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Incline Dumbbell Row", sets: 3, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Seated Cable Row", sets: 3, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Barbell Shrug", sets: 4, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Barbell Curl", sets: 3, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Seated Barbell Curl", sets: 3, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Reverse-Grip Barbell or EZ-Bar Curl", sets: 3, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Behind-The-Back Wrist Curl", sets: 3, reps: "6-8", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
    { phase: "Phase 2", week: "Week 5", workoutNumber: "Workout 4", focus: "Chest, Triceps, Abs", jointType: "Single Joint", exercises: [
        { name: "Cable Crossover from Low Pulley", sets: 4, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Cable Crossover", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Flye", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Overhead Cable Triceps Extension", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Lying Triceps Extension", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Rope Triceps Pressdown", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Crossover Crunch", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Cable Woodchopper", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
    { phase: "Phase 2", week: "Week 5", workoutNumber: "Workout 5", focus: "Shoulders, Legs, Calves", jointType: "Single Joint", exercises: [
        { name: "Dumbbell Lateral Raise", sets: 4, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Cable Front Raise", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Lying Cable Rear Delt Flye", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Leg Extension", sets: 4, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Leg Curl", sets: 4, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Seated Calf Raise", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Donkey or Leg Press Calf Raise", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
    { phase: "Phase 2", week: "Week 5", workoutNumber: "Workout 6", focus: "Back, Traps, Biceps", jointType: "Single Joint", exercises: [
        { name: "Lat Pulldown", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" }, 
        { name: "Behind-the-Neck Pulldown", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Rope Straight-Arm Pulldown", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Shrug", sets: 4, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "EZ-Bar Cable Curl", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Incline Dumbbell Curl", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Hammer Curl", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Reverse Wrist Curl", sets: 3, reps: "16-20", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
    // Phase 2, Week 6
    { phase: "Phase 2", week: "Week 6", workoutNumber: "Workout 1", focus: "Chest, Triceps, Abs", jointType: "Multi-Joint", exercises: [
        { name: "Bench Press", sets: 4, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Incline Bench Press", sets: 3, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Decline Dumbbell Press", sets: 3, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dips", sets: 4, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Close-Grip Bench Press", sets: 4, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Smith Machine Crunch", sets: 3, reps: "4-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "(Unnamed exercise from source 70)", sets: null, reps: "4-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" }, 
        { name: "Hanging Leg Raise", sets: 3, reps: null, cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" }, 
    ]},
     { phase: "Phase 2", week: "Week 6", workoutNumber: "Workout 2", focus: "Shoulders, Legs, Calves", jointType: "Multi-Joint", exercises: [
        { name: "Barbell Shoulder Press", sets: 4, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Shoulder Press (Seated)", sets: 3, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Upright Row", sets: 3, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Squat", sets: 3, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" }, 
        { name: "Deadlift", sets: 3, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Leg Press", sets: 3, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Standing Calf Raise", sets: 3, reps: "4-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Seated Calf Raise", sets: 3, reps: "4-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
    { phase: "Phase 2", week: "Week 6", workoutNumber: "Workout 3", focus: "Back, Traps, Biceps", jointType: "Multi-Joint", exercises: [
        { name: "Barbell Bent Over Row", sets: 4, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Incline Dumbbell Row", sets: 3, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Seated Cable Row", sets: 3, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Barbell Shrug", sets: 4, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Barbell Curl", sets: 3, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Seated Barbell Curl", sets: 3, reps: "2-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Reverse-Grip Barbell or EZ-Bar Curl", sets: 2, reps: "4-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Behind-The-Back Wrist Curl", sets: 2, reps: "4-5", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
    { phase: "Phase 2", week: "Week 6", workoutNumber: "Workout 4", focus: "Chest, Triceps, Abs", jointType: "Single Joint", exercises: [
        { name: "Cable Crossover from Low Pulley", sets: 4, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Cable Crossover", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Flye", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Overhead Cable Triceps Extension", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Lying Triceps Extension", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Rope Triceps Pressdown", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Crossover Crunch", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Cable Woodchopper", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
    { phase: "Phase 2", week: "Week 6", workoutNumber: "Workout 5", focus: "Shoulders, Legs, Calves", jointType: "Single Joint", exercises: [
        { name: "Dumbbell Lateral Raise", sets: 4, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Cable Front Raise", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Lying Cable Rear Delt Flye", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Leg Extension", sets: 4, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Leg Curl", sets: 4, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Seated Calf Raise", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Donkey or Leg Press Calf Raise", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
    { phase: "Phase 2", week: "Week 6", workoutNumber: "Workout 6", focus: "Back, Traps, Biceps", jointType: "Single Joint", exercises: [
        { name: "Lat Pulldown", sets: 4, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Behind-the-Neck Pulldown", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Rope Straight-Arm Pulldown", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Shrug", sets: 4, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "EZ-Bar Cable Curl", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Incline Dumbbell Curl", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Hammer Curl", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
        { name: "Dumbbell Reverse Wrist Curl", sets: 3, reps: "21-30", cardio: "60 seconds", notes: "Cardio accelerated rest-pause dropset on last set" },
    ]},
].map((workout, index) => ({ ...workout, id: `workout-${index}`}));

// --- Utility Functions ---
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const parseCardioTimeToSeconds = (cardioString) => {
  if (!cardioString) return 0;
  const parts = cardioString.toLowerCase().split(" ");
  if (parts.length < 2) return 0; 
  const time = parseInt(parts[0]);
  if (isNaN(time)) return 0; 

  if (parts[1].startsWith("second")) return time;
  if (parts[1].startsWith("minute")) return time * 60;
  return 0;
};

// --- Main App Component ---
function App() {
  const [currentView, setCurrentView] = useState('list'); 
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutCompletion, setWorkoutCompletion] = useState({}); 
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Error during anonymous sign-in:", error);
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !userId) return;

    const userCompletionDocRef = doc(db, `artifacts/${appId}/users/${userId}/workoutCompletion`, 'status');
    const unsubscribe = onSnapshot(userCompletionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setWorkoutCompletion(docSnap.data() || {});
      } else {
        setWorkoutCompletion({}); 
      }
    }, (error) => {
        console.error("Error fetching completion data:", error);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId]);

  const saveCompletionData = async (newCompletionData) => {
    if (!isAuthReady || !userId) {
        console.error("User not authenticated or auth not ready. Cannot save.");
        return;
    }
    try {
      const userCompletionDocRef = doc(db, `artifacts/${appId}/users/${userId}/workoutCompletion`, 'status');
      await setDoc(userCompletionDocRef, newCompletionData, { merge: true });
    } catch (error) {
      console.error("Error saving completion data to Firestore:", error);
    }
  };

  const handleSelectWorkout = (workout) => {
    setSelectedWorkout(workout);
    setCurrentView('detail');
  };

  const handleGoBackToList = () => {
    setSelectedWorkout(null);
    setCurrentView('list');
  };

  const toggleExerciseComplete = (workoutId, exerciseIndex) => {
    const newCompletion = JSON.parse(JSON.stringify(workoutCompletion)); 

    if (!newCompletion[workoutId]) {
      newCompletion[workoutId] = { completed: false, exercises: {} };
    }
    if (!newCompletion[workoutId].exercises) {
        newCompletion[workoutId].exercises = {};
    }
    newCompletion[workoutId].exercises[exerciseIndex] = !newCompletion[workoutId].exercises[exerciseIndex];
    
    const currentWorkout = WORKOUT_PROGRAM_DATA.find(w => w.id === workoutId);
    if (currentWorkout) {
        const allExercisesMarked = currentWorkout.exercises.every((_, idx) => newCompletion[workoutId].exercises[idx]);
        newCompletion[workoutId].completed = allExercisesMarked;
    }

    setWorkoutCompletion(newCompletion);
    saveCompletionData(newCompletion);
  };

  const handleCompleteWorkout = (workoutId) => {
    const newCompletion = JSON.parse(JSON.stringify(workoutCompletion)); 

    if (!newCompletion[workoutId]) {
      newCompletion[workoutId] = { completed: false, exercises: {} };
    }
    newCompletion[workoutId].completed = true;
    
    const currentWorkout = WORKOUT_PROGRAM_DATA.find(w => w.id === workoutId);
    if (currentWorkout) {
        if (!newCompletion[workoutId].exercises) {
            newCompletion[workoutId].exercises = {};
        }
        currentWorkout.exercises.forEach((_, idx) => {
            newCompletion[workoutId].exercises[idx] = true;
        });
    }
    setWorkoutCompletion(newCompletion);
    saveCompletionData(newCompletion);
  };
  
  if (!isAuthReady) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white"><div className="text-xl">Loading Fitness App...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-gray-800 shadow-xl rounded-lg overflow-hidden flex flex-col" style={{minHeight: 'calc(100vh - 2rem)'}}>
        {currentView === 'list' && (
          <WorkoutListPage
            workouts={WORKOUT_PROGRAM_DATA}
            onSelectWorkout={handleSelectWorkout}
            completionStatus={workoutCompletion}
          />
        )}
        {currentView === 'detail' && selectedWorkout && (
          <WorkoutDetailPage
            workout={selectedWorkout}
            onGoBack={handleGoBackToList}
            completionStatus={workoutCompletion[selectedWorkout.id] || { exercises: {} }}
            onToggleExercise={toggleExerciseComplete}
            onCompleteWorkout={handleCompleteWorkout}
          />
        )}
      </div>
    </div>
  );
}

// --- Workout List Page ---
function WorkoutListPage({ workouts, onSelectWorkout, completionStatus }) {
  const groupedWorkouts = workouts.reduce((acc, workout) => {
    const phaseKey = workout.phase;
    const weekKey = workout.week;
    if (!acc[phaseKey]) acc[phaseKey] = {};
    if (!acc[phaseKey][weekKey]) acc[phaseKey][weekKey] = [];
    acc[phaseKey][weekKey].push(workout);
    return acc;
  }, {});

  return (
    <div className="flex-grow overflow-y-auto">
      <header className="bg-gray-700 p-4 shadow-md sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-center text-teal-400">Workout Program</h1>
      </header>
      <div className="p-4 space-y-6">
        {Object.entries(groupedWorkouts).map(([phase, weeks]) => (
          <div key={phase} className="bg-gray-750 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-teal-300 mb-3 border-b border-gray-600 pb-2">{phase}</h2>
            {Object.entries(weeks).map(([week, workoutList]) => (
              <div key={week} className="mb-4">
                <h3 className="text-lg font-medium text-teal-400 mb-2">{week}</h3>
                <ul className="space-y-2">
                  {workoutList.map((workout) => (
                    <WorkoutListItem
                      key={workout.id}
                      workout={workout}
                      onSelectWorkout={onSelectWorkout}
                      isCompleted={completionStatus[workout.id]?.completed || false}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Workout List Item ---
function WorkoutListItem({ workout, onSelectWorkout, isCompleted }) {
  return (
    <li
      onClick={() => onSelectWorkout(workout)}
      className={`p-4 bg-gray-800 rounded-md shadow-sm hover:bg-gray-700 transition-colors duration-150 cursor-pointer flex justify-between items-center ${isCompleted ? 'border-l-4 border-green-500' : 'border-l-4 border-teal-500'}`}
    >
      <div>
        <h4 className="font-semibold text-md text-teal-400">{workout.workoutNumber}</h4>
        <p className="text-sm text-gray-300">{workout.focus}</p>
        <p className="text-xs text-gray-400">{workout.jointType}</p>
      </div>
      {isCompleted && <CheckIcon className="w-5 h-5 text-green-500" />}
    </li>
  );
}

// --- Workout Detail Page ---
function WorkoutDetailPage({ workout, onGoBack, completionStatus, onToggleExercise, onCompleteWorkout }) {
  const [overallTime, setOverallTime] = useState(0);
  const [isOverallTimerRunning, setIsOverallTimerRunning] = useState(true);
  const overallTimerIntervalRef = useRef(null);

  const [cardioTime, setCardioTime] = useState(0);
  const [isCardioTimerRunning, setIsCardioTimerRunning] = useState(false);
  // CHANGED: Removed unused currentCardioDuration state variable
  const [activeCardioExerciseIndex, setActiveCardioExerciseIndex] = useState(null); 
  const cardioTimerIntervalRef = useRef(null);

  useEffect(() => {
    setIsOverallTimerRunning(true); 
    setOverallTime(0); 
    return () => { 
        clearInterval(overallTimerIntervalRef.current);
        clearInterval(cardioTimerIntervalRef.current);
    }
  }, [workout]); 

  useEffect(() => {
    if (isOverallTimerRunning) {
      overallTimerIntervalRef.current = setInterval(() => {
        setOverallTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(overallTimerIntervalRef.current);
    }
    return () => clearInterval(overallTimerIntervalRef.current);
  }, [isOverallTimerRunning]);

  useEffect(() => {
    if (isCardioTimerRunning && cardioTime > 0) {
      cardioTimerIntervalRef.current = setInterval(() => {
        setCardioTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (cardioTime === 0 && isCardioTimerRunning) {
      setIsCardioTimerRunning(false);
      setActiveCardioExerciseIndex(null);
      clearInterval(cardioTimerIntervalRef.current);
    }
    return () => clearInterval(cardioTimerIntervalRef.current);
  }, [isCardioTimerRunning, cardioTime]);

  const handleStartCardio = (durationString, exerciseIndex) => {
    if (isCardioTimerRunning) {
        clearInterval(cardioTimerIntervalRef.current);
    }
    const seconds = parseCardioTimeToSeconds(durationString);
    // CHANGED: Removed setCurrentCardioDuration(seconds) as state variable is removed
    setCardioTime(seconds);
    setIsCardioTimerRunning(true);
    setActiveCardioExerciseIndex(exerciseIndex);
  };

  const handlePauseResumeCardio = () => {
    setIsCardioTimerRunning(!isCardioTimerRunning);
  };

  const handleStopCardio = () => {
    setIsCardioTimerRunning(false);
    setActiveCardioExerciseIndex(null);
    setCardioTime(0); 
  };

  const handleToggleOverallTimer = () => {
    setIsOverallTimerRunning(!isOverallTimerRunning);
  };

  const exercisesCompletionStatus = completionStatus?.exercises || {};
  // CHANGED: Removed unused 'allExercisesDone' variable
  const isWorkoutOfficiallyCompleted = completionStatus?.completed || false;


  return (
    <div className="flex flex-col h-full">
      <header className="bg-gray-700 p-4 shadow-md sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <button onClick={onGoBack} className="p-2 rounded-full hover:bg-gray-600 transition-colors">
            <ChevronLeftIcon className="w-6 h-6 text-teal-400" />
          </button>
          <div className="text-center flex-grow">
            <h2 className="text-lg font-semibold text-teal-400">{workout.phase} - {workout.week}</h2>
            <h1 className="text-xl font-bold text-white">{workout.workoutNumber}: {workout.focus}</h1>
            <p className="text-sm text-gray-300">{workout.jointType}</p>
          </div>
          <div className="w-10"> {/* Spacer */} </div>
        </div>
        <div className="mt-2 text-center">
          <span className="text-sm text-gray-300">Workout Time: {formatTime(overallTime)}</span>
          <button onClick={handleToggleOverallTimer} className="ml-2 p-1 text-xs bg-teal-500 hover:bg-teal-600 rounded text-white">
            {isOverallTimerRunning ? <PauseIcon className="w-4 h-4 inline"/> : <PlayIcon className="w-4 h-4 inline"/>}
          </button>
        </div>
      </header>

      {isCardioTimerRunning || (cardioTime > 0 && !isCardioTimerRunning) ? ( 
        <div className="bg-teal-600 p-3 text-white text-center sticky top-[calc(4rem+1.5rem+1rem)] z-10"> 
          <p className="text-lg font-semibold">Cardio: {formatTime(cardioTime)}</p>
          <div className="flex justify-center space-x-2 mt-1">
            <button onClick={handlePauseResumeCardio} className="p-2 bg-teal-700 hover:bg-teal-800 rounded-full">
              {isCardioTimerRunning ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button onClick={handleStopCardio} className="p-2 bg-red-500 hover:bg-red-600 rounded-full">
              <StopIcon />
            </button>
          </div>
        </div>
      ) : null}
      
      <ul className="p-4 space-y-3 flex-grow overflow-y-auto pb-20"> 
        {workout.exercises.map((exercise, index) => (
          <ExerciseItem
            key={index}
            exercise={exercise}
            exerciseIndex={index} 
            isCompleted={exercisesCompletionStatus[index] || false}
            onToggleComplete={() => onToggleExercise(workout.id, index)}
            onStartCardio={handleStartCardio}
            isThisCardioActive={activeCardioExerciseIndex === index && isCardioTimerRunning}
          />
        ))}
      </ul>

      <footer className="p-4 bg-gray-700 border-t border-gray-600 sticky bottom-0 z-20"> 
        <button
          onClick={() => onCompleteWorkout(workout.id)}
          disabled={isWorkoutOfficiallyCompleted} 
          className={`w-full py-3 px-4 rounded-md font-semibold text-white transition-colors
            ${isWorkoutOfficiallyCompleted ? 'bg-green-600 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600'}`}
        >
          {isWorkoutOfficiallyCompleted ? 'Workout Completed!' : 'Mark Workout as Complete'}
        </button>
      </footer>
    </div>
  );
}

// --- Exercise Item ---
function ExerciseItem({ exercise, exerciseIndex, isCompleted, onToggleComplete, onStartCardio, isThisCardioActive }) {
  return (
    <li className={`p-3 bg-gray-750 rounded-lg shadow-sm flex flex-col space-y-2 ${isThisCardioActive ? 'ring-2 ring-teal-500' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={onToggleComplete}
            className="form-checkbox h-5 w-5 text-teal-500 bg-gray-800 border-gray-600 rounded focus:ring-teal-400 cursor-pointer"
          />
          <span className={`text-md font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-100'}`}>
            {exercise.name}
          </span>
        </div>
        <span className="text-sm text-gray-300">
          {exercise.sets ? `${exercise.sets} sets` : ''} {exercise.reps ? `x ${exercise.reps} reps` : ''}
        </span>
      </div>
      
      {exercise.notes && (
        <p className="text-xs text-yellow-400 bg-gray-700 p-2 rounded-md">Note: {exercise.notes}</p>
      )}

      {exercise.cardio && (
        <div className="flex items-center justify-between pt-1 border-t border-gray-700 mt-2">
            <p className="text-sm text-teal-300">Cardio Between Sets: {exercise.cardio}</p>
            <button
                onClick={() => onStartCardio(exercise.cardio, exerciseIndex)} 
                className="px-3 py-1 text-xs bg-teal-500 hover:bg-teal-600 text-white rounded-md transition-colors"
            >
                Start Cardio Timer
            </button>
        </div>
      )}
    </li>
  );
}

export default App;