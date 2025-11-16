import json

with open('claude6_javanese.json', 'r') as f:
    data = json.load(f)

print('\n✓ JSON valido')
print(f'✓ Conversazioni totali: {len(data["conversations"])}')
print(f'✓ ID primo: {data["conversations"][0]["conversation_id"]}')
print(f'✓ ID ultimo: {data["conversations"][-1]["conversation_id"]}')
print(f'✓ Messaggi totali: {data["total_conversations"]}')
print('\n✓ Distribuzione:')

ngoko = sum(1 for c in data["conversations"] if c["style"]=="ngoko" and c["dialect"]=="standard")
krama = sum(1 for c in data["conversations"] if c["style"]=="krama")
mixed = sum(1 for c in data["conversations"] if c["style"]=="mixed")
yogya = sum(1 for c in data["conversations"] if c["dialect"]=="yogyakarta")
sura = sum(1 for c in data["conversations"] if c["dialect"]=="surabaya")

print(f'  - Ngoko: {ngoko}')
print(f'  - Krama: {krama}')
print(f'  - Mixed: {mixed}')
print(f'  - Yogyakarta: {yogya}')
print(f'  - Surabaya: {sura}')
print(f'\n✓ TOTALE: {ngoko + krama + mixed + yogya + sura}')

# Sample
print('\n✓ Esempio conversazione Ngoko:')
sample_ngoko = [c for c in data["conversations"] if c["style"]=="ngoko" and c["dialect"]=="standard"][0]
print(f'  Topic: {sample_ngoko["topic"]}')
print(f'  Messages: {len(sample_ngoko["messages"])}')
for msg in sample_ngoko["messages"][:3]:
    print(f'  {msg["speaker"]}: {msg["message"]}')
