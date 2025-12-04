# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img "ZANTARA" [ref=e7]
      - paragraph [ref=e8]: Sign in to continue
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: Email
        - textbox "Email" [ref=e12]:
          - /placeholder: anton@balizero.com
      - generic [ref=e13]:
        - generic [ref=e14]: PIN
        - textbox "PIN" [ref=e15]:
          - /placeholder: Enter your PIN
      - button "Sign In" [ref=e16] [cursor=pointer]
```