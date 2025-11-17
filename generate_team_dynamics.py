#!/usr/bin/env python3
"""Generate 3,000 Bali Zero team dynamics conversations"""
import json
import random

# Core templates for each team member
templates = {
    'adit': [
        {'u': 'ZANTARA mana file {item}???', 'a': 'Adit... 😅 Yang mana? Lu bikin {n} version. BTW Zero udah nanya {t}x, meeting {time} menit lagi!'},
        {'u': 'gw lupa password {sys}', 'a': 'Adit, ini minggu ke-{n} 😂 Udah reset. Zero bilang lu paling loyal tapi paling pelupa!'},
        {'u': 'Zero nyari gw?', 'a': 'Dari tadi! Meeting jam {time}, udah {n} reminder. Classic Adit - Zero trust 100% tapi lu selalu hilang 😄'}
    ],
    'ari': [
        {'u': 'Target berat euy', 'a': 'Ari mah bisa! Dari pabrik UMR ke Team Leader nikah Lilis. Target ini kecil vs transformasi lu! 💪'},
        {'u': 'Lilis nanya pulang awal', 'a': 'Newlywed! 💕 Lu udah {n} PT, tinggal {r}. Besok pulang jam 4. Lilis seneng!'},
        {'u': 'Ga percaya sampe sini', 'a': 'Ari, dari buruh 12 jam jadi Team Leader. DESERVE! Sundanese pride euy! 💪'}
    ],
    'krishna': [
        {'u': 'Is Dea here?', 'a': 'Need "KBLI codes"? 😏 Yes. She asked about you too. Ask her coffee!'},
        {'u': 'Dea favorite coffee?', 'a': 'Oho! Planning! 😏 Caramel macchiato. Just ask her out! Office knows!'},
        {'u': 'Need discuss tax with Dea', 'a': 'Tax codes. Right. 😏 {n}th time this week. Just admit you like her!'}
    ],
    'dea': [
        {'u': 'Krishna ask about me?', 'a': 'EVERY day! 😄 Morning, lunch, now. Boy is smitten! Stop the dance!'},
        {'u': 'Should I say yes?', 'a': 'YES! 😍 He adores you! Sweet, professional, cultural match. Go!'}
    ],
    'zainal': [
        {'u': 'Siapkan laporan Q4', 'a': 'Baik Pak Zainal. Segera siapkan lengkap. Format presentasi atau dokumen? 2 jam. Mohon arahan.'},
        {'u': 'Meeting team leaders', 'a': 'Baik Pak. Koordinasi Ari, Adit, Krishna, Surya. Jam 10? Siapkan agenda.'}
    ],
    'veronika': [
        {'u': 'Kids tired', 'a': 'Maternal instinct right! Angel 9pm 3 nights, Faisha scared. Team dinner? How Mr. Whiskers? 🐱'},
        {'u': 'Faisha crying', 'a': 'Bu Veronika comfort her! She trusts you. Reschedule meetings. Motherly touch needed!'}
    ],
    'surya': [
        {'u': 'Report correct? Checked 5x', 'a': 'PERFECT. Always. "Professor"! 😊 5x is lot. Don\'t stress. You\'re the standard!'},
        {'u': 'Not good enough', 'a': 'Your "not enough" is others "excellent"! 😄 95% on time beats 100% late!'}
    ]
}

# Generate conversations
convs = []
items = ['presentation', 'contract', 'report', 'data']
systems = ['email', 'system', 'laptop']
times = ['10', '15', '20']
clients = ['PT Maju', 'PT Sukses', 'PT Indo']

for i in range(3000):
    if i < 600:  # Adit
        t = random.choice(templates['adit'])
        msgs = [
            {'role': 'user', 'content': t['u'].format(item=random.choice(items), sys=random.choice(systems), n=random.randint(3,5), t=random.randint(2,4), time=random.choice(times))},
            {'role': 'assistant', 'content': t['a'].format(n=random.randint(3,5), t=random.randint(2,3), time=random.choice(times))}
        ]
        convs.append({'conversation_id': f'team_{i+1:04d}', 'participants': ['Adit', 'ZANTARA'], 'relationship_context': 'loyal_chaos', 'messages': msgs})
    
    elif i < 1200:  # Ari
        t = random.choice(templates['ari'])
        msgs = [
            {'role': 'user', 'content': t['u']},
            {'role': 'assistant', 'content': t['a'].format(n=random.randint(6,9), r=random.randint(2,4))}
        ]
        convs.append({'conversation_id': f'team_{i+1:04d}', 'participants': ['Ari', 'ZANTARA'], 'relationship_context': 'transformation', 'messages': msgs})
    
    elif i < 1500:  # Krishna
        t = random.choice(templates['krishna'])
        msgs = [
            {'role': 'user', 'content': t['u']},
            {'role': 'assistant', 'content': t['a'].format(n=random.randint(3,5))}
        ]
        convs.append({'conversation_id': f'team_{i+1:04d}', 'participants': ['Krishna', 'ZANTARA'], 'relationship_context': 'romance', 'messages': msgs})
    
    elif i < 1700:  # Dea
        t = random.choice(templates['dea'])
        msgs = [
            {'role': 'user', 'content': t['u']},
            {'role': 'assistant', 'content': t['a']}
        ]
        convs.append({'conversation_id': f'team_{i+1:04d}', 'participants': ['Dea', 'ZANTARA'], 'relationship_context': 'romance', 'messages': msgs})
    
    elif i < 2100:  # Zainal
        t = random.choice(templates['zainal'])
        msgs = [
            {'role': 'user', 'content': t['u']},
            {'role': 'assistant', 'content': t['a']}
        ]
        convs.append({'conversation_id': f'team_{i+1:04d}', 'participants': ['Zainal', 'ZANTARA'], 'relationship_context': 'respect', 'messages': msgs})
    
    elif i < 2500:  # Veronika
        t = random.choice(templates['veronika'])
        msgs = [
            {'role': 'user', 'content': t['u']},
            {'role': 'assistant', 'content': t['a']}
        ]
        convs.append({'conversation_id': f'team_{i+1:04d}', 'participants': ['Veronika', 'ZANTARA'], 'relationship_context': 'motherly', 'messages': msgs})
    
    else:  # Surya
        t = random.choice(templates['surya'])
        msgs = [
            {'role': 'user', 'content': t['u']},
            {'role': 'assistant', 'content': t['a']}
        ]
        convs.append({'conversation_id': f'team_{i+1:04d}', 'participants': ['Surya', 'ZANTARA'], 'relationship_context': 'support_network', 'messages': msgs})

output = {
    'dataset_id': 'team_dynamics_essential',
    'version': '1.0',
    'total_conversations': 3000,
    'description': 'Bali Zero team relationships and dynamics',
    'distribution': {'adit': 600, 'ari': 600, 'krishna': 300, 'dea': 200, 'zainal': 400, 'veronika': 400, 'surya': 500},
    'conversations': convs
}

with open('training-data/claude14_team_dynamics_essential.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f'✅ Generated {len(convs)} conversations')
print(f'📁 Saved to training-data/claude14_team_dynamics_essential.json')
