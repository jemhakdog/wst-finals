<?php
$recipe = [
    'id' => 'sinigang',
    'title' => 'Sinigang',
    'author' => '',
    'description' => 'Filipino sour soup with pork and vegetables',
    'prep_time' => '10m',
    'cook_time' => '1h',
    'total_time' => 'N/A',
    'servings' => '4',
    'difficulty' => 'Medium',
    'cuisine' => 'Filipino',
    'category' => 'Main Course',
    'rating' => 5,
    'rating_count' => 3,
    'image_url' => 'https://panlasangpinoy.com/wp-content/uploads/2022/09/pork-sinigang-panlasang-pinoy.jpg',
    'ingredients' => [
        '2 lbs. pork belly (see notes)',
        '1 lb. young tamarind (see notes)',
        '1 bunch  water spinach (chopped)',
        '8 pieces string beans (cut into 2-inch pieces)',
        '2 pieces eggplants (sliced)',
        '1 piece daikon radish (see notes)',
        '8 pieces okras',
        '2 pieces tomatoes (sliced into wedges)',
        '2 pieces long green pepper',
        '1 piece onion (sliced into wedges)',
        '2 quarts water',
        'Fish sauce and ground black pepper  (to taste)',
    ],
    'instructions' => [
        'Boil the young tamarind in 2 quarts of water for 40 minutes. Filter the tamarind broth using a kitchen sieve or a strainer. Squeeze the tamarind afterwards to extract its remaining juices.',
        'Pour the tamarind broth into a cooking pot. Let it boil and then add the onion, pork belly, and half the amount of the tomatoes.',
        'Skim-off the floating scums, pour 1 tablespoon fish sauce, cover and continue to simmer for 1 hour.',
        'Add daikon radish and eggplants. Cook for 5 minutes.',
        'Add the long green pepper, string beans, remaining tomatoes, and okra. Cook for 3 minutes.',
        'Add the chopped water spinach stalks and season with fish sauce and ground black pepper. Cook for 2 minutes.',
        'Put the water spinach leaves. Cover and turn the heat off. Let the residual heat cook the leaves for 3 minutes before serving.',
        'Share and enjoy!',
    ],
    'nutrition' => [
        'calories' => '1538 kcal',
        'carbohydrateContent' => '91 g',
        'proteinContent' => '29 g',
        'fatContent' => '121 g',
        'saturatedFatContent' => '44 g',
        'cholesterolContent' => '163 mg',
        'sodiumContent' => '175 mg',
        'fiberContent' => '13 g',
        'sugarContent' => '54 g',
        'unsaturatedFatContent' => '69 g',
        'servingSize' => '1 serving',
    ]
];

include dirname(__FILE__) . '/../recipe-template.php';
?>