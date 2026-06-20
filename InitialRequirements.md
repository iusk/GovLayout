# Initial Requirements

This document contains the intial set of requirements for the project titled "U.S. Government Layout".

# Goal

The goal of this project is to display the makeup of the three branches of the U.S government in a simplified Layout.

# Layout (UI)

Since the goal is to present already available data in a simplified way, the Layout is very important and must be followed precisely.

The data needs to be dynamic so all of it must come from the backend. The UI shouldn't have any hardcoded data on it.

## UX Design

This project should use Google's Material Design to design it's element. https://m3.material.io/
I want the primary color to be the blue in American Flag and secondary color to be red of the same flag. These are very bright colors, so use them sparingly. Things like background color should be defined for dark mode. This project won't support light mode at least initially.

## Index (U.S. Government Layout)

The first page will be three buttons, spaced out properly, each with text "Executive", "Legislative" and "Congress". Clicking on these should take you to their respective pages.

## Common Layout Components

- Whenever we are on the non-index page, we must see a "Back" button towards the top right.
- Whenever a government representative (President, Senator, etc.) is being displayed on the web page, they need to have a picture with circular border and their name at the bottom.
- Each page should have a title centered at the top. The title is listed in the heading of each page section in the document.

## Executive

Centered top should be the current President - Donald Trump. Below that should be essential roles of the executive branch. => List out those roles here <=

## Legislative

This page should show the hierarchy of the judges starting from the "Supreme Court" to lower courts. Should the hierarchy in the similar looking boxy buttons you have in the Index page for the three branches. The first one "Supreme Court" should be clickable.

### Supreme Court

This page should list the 9 Supreme Court judges. Reminder here that all government representatives should have the same layout with circular bordered frame containing their pictures and their name at the bottom.

## Congress

This page should show two buttons "Upper Body/Senate" and "Lower Body/House". Either can be clicked to get to their respective pages.

### Senate

This page should use the popular way of showing makeup of the Congress with a U-Shape filled with dots, where each dot is a member. The left half of the U-Shape should be seperate from the right-half, so that when the webpage is viewed in a smaller screen, they breakdown and show top to bottom instead of left to right.

### House of Representatives

Similar to Senate, this page should also have the dots, but will obviously have more dots to represent all the House members.

### Sentate/House common parts

The dots will be filled with either blue color or red color, depending on their party. The dots on both of these pages need to expand when hovered over and be clickable, when clicked it needs to take the user to this member's opensecrets web page.

Both of these pages should also have a dropdown above the U-Shaped graphic that lets you choose between "Party" and "Money". When Party is selected, these dots will be filled with blue or red color depending on the party. When Money is selected, these dots will be filled with Green (no money), Yellow (a little bit of money), Red (a lot of money) based on how much money this member has taken from PACs.

## Data

Figure out where to get these information we need. Looks for APIs we could use to get these information and see if we need to create our own db to optimize storage and retrieval of the data.

### Amount of money

To determine what the color should be when "Money" mode is selected, compare the proportion of money the member is getting from Big Donors like PACs and how much of it comes from Labor and small money donations (upto $200). 0% from Big Donors like PACs is a green, less than 25% is yellow and more than that is red.
