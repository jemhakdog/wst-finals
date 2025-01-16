<?php
$recipe = [
    'id' => 'chicken-adobo',
    'title' => 'Chicken Adobo',
    'author' => 'Vanjo Merano',
    'description' => 'Chicken slices cooked in soy sauce and vinegar with garlic. This is a delicious Filipino chicken dish that you can eat for lunch with warm white rice.',
    'prep_time' => '5m',
    'cook_time' => '35m',
    'total_time' => '40m',
    'servings' => '4',
    'difficulty' => 'Medium',
    'cuisine' => 'Filipino',
    'category' => 'Main Course',
    'rating' => 4.92,
    'rating_count' => 97,
    'image_url' => 'https://panlasangpinoy.com/wp-content/uploads/2024/04/Filipino-Chicken-Adobo-Recipe.jpg',
    'ingredients' => [
        '2 lbs chicken ((note 1))',
        '3 pieces dried bay leaves ((note 2))',
        '4 tablespoons soy sauce ((note 3))',
        '6 tablespoons white vinegar ((note 4))',
        '5 cloves garlic ((note 5))',
        '1 1/2 cups water',
        '3  tablespoons cooking oil',
        '1 teaspoon sugar ((note 6))',
        '1/4 teaspoon salt  ((note 7))',
        '1  teaspoon whole peppercorn ((note 8))',
    ],
    'instructions' => [
        'Combine chicken, soy sauce, and garlic in a large bowl. Mix well. Marinate the chicken for at least 1 hour. Note: the longer the time, the better',
        'Heat a cooking pot. Pour cooking oil.',
        'When the oil is hot enough, pan-fry the marinated chicken for 2 minutes per side.',
        'Pour-in the remaining marinade, including garlic. Add water. Bring to a boil',
        'Add dried bay leaves and whole peppercorn. Simmer for 30 minutes or until the chicken gets tender',
        'Add vinegar. Stir and cook for 10 minutes.',
        'Put-in the sugar, and salt. Stir and turn the heat off.Serve hot. Share and Enjoy!',
    ],
    'nutrition' => [
        'calories' => '607 kcal',
        'carbohydrateContent' => '4 g',
        'proteinContent' => '44 g',
        'fatContent' => '44 g',
        'saturatedFatContent' => '10 g',
        'cholesterolContent' => '170 mg',
        'sodiumContent' => '1317 mg',
        'sugarContent' => '1 g',
        'servingSize' => '1 serving',
    ]
];

include dirname(__FILE__) . '/../recipe-template.php';
?>