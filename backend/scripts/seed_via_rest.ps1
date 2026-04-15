# Seed Supabase via REST using the service role key
$base = 'https://joqmuusjfunvmuzihjsz.supabase.co/rest/v1'
$k = $env:SUPABASE_SERVICE_KEY
if (-not $k) {
    throw "Set SUPABASE_SERVICE_KEY in your environment before running this script."
}
function PostJson($path, $json) {
    Write-Host "POST $path ->"
    & curl -s -X POST "$base/$path" -H "apikey: $k" -H "Authorization: Bearer $k" -H "Content-Type: application/json" -H "Prefer: return=representation" -d $json | Write-Host
}

# Fixed UUIDs (change if you prefer freshly generated GUIDs)
$userId = '11111111-1111-1111-1111-111111111111'
$postId = '22222222-2222-2222-2222-222222222222'
$commentId = '33333333-3333-3333-3333-333333333333'
$likeId = '44444444-4444-4444-4444-444444444444'
$media1 = '55555555-5555-5555-5555-555555555555'
$media2 = '66666666-6666-6666-6666-666666666666'
$media3 = '77777777-7777-7777-7777-777777777777'

# Create admin user
$user = @{
    id = $userId
    email = 'admin@sankofa.local'
    name = 'Site Admin'
    role = 'admin'
    password = 'AdminPass123!'
} | ConvertTo-Json
PostJson 'app_user' $user

# Create post
$post = @{
    id = $postId
    title = 'Welcome to Sankofa'
    slug = 'welcome-to-sankofa'
    content = 'This is a seeded welcome post. Replace with your real content.'
    published = $true
    author_id = $userId
} | ConvertTo-Json
PostJson 'post' $post

# Create comment
$comment = @{
    id = $commentId
    post_id = $postId
    author_id = $userId
    content = 'First seeded comment.'
} | ConvertTo-Json
PostJson 'comment' $comment

# Create like
$like = @{
    id = $likeId
    post_id = $postId
    user_id = $userId
} | ConvertTo-Json
PostJson 'likes' $like

# Create media rows
$media = @(
    @{id=$media1; url='/wp-content/uploads/library-pdfs/john_iliffe_africans_the_history_of_a_continentbookos.org_.pdf'; filename='john_iliffe_africans_the_history_of_a_continentbookos.org_.pdf'; mimetype='application/pdf'; uploaded_by_id=$userId},
    @{id=$media2; url='/wp-content/uploads/library-pdfs/Fondad-AfricaWorld-BookComplete.pdf'; filename='Fondad-AfricaWorld-BookComplete.pdf'; mimetype='application/pdf'; uploaded_by_id=$userId},
    @{id=$media3; url="/wp-content/uploads/library-pdfs/Decolonising the mind-Ngugi Wa Thiong'O.pdf"; filename="Decolonising the mind-Ngugi Wa Thiong'O.pdf"; mimetype='application/pdf'; uploaded_by_id=$userId}
)
$media | ConvertTo-Json | % { PostJson 'media' $_ }

Write-Host 'Seeding completed.'
