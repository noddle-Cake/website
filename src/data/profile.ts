export const profile = {
  name: 'Chris Servin',
  tagline:
    'Computer Science graduate and M.S. Electrical Engineering (RF/Wireless) student building embedded systems, Python automation pipelines, and secure internal web applications.',
  email: 'chris.servin001@gmail.com',
  linkedin: 'https://www.linkedin.com/in/chris-servin001/',
  education: [
    {
      school: 'Florida International University',
      degree: 'M.S. Electrical Engineering, RF/Wireless Concentration',
      date: 'Summer 2026',
    },
    {
      school: 'Florida International University',
      degree: 'B.S. Computer Science',
      date: 'December 2024',
    },
  ],
  experience: [
    {
      role: 'Inventory Coordinator / Data Automation',
      org: 'VAS Agriculture',
      date: 'Jan 2026 – Present',
      highlights: [
        'Sole engineer on a Go REST API, React web app and React Native mobile app (35+ screens across five role-based workspaces) that replaced a Python/NiceGUI prototype. It syncs from the Fishbowl ERP and serves 25 users and ~200 inventory moves a day.',
        'Profiled and rebuilt search across seven surfaces with trigram indexes, concurrent page and count queries, and Postgres tuning, cutting per-keystroke item search from 40 ms to 1.9 ms.',
        'Ported a DDMRP buffer engine to Go that recomputes 5,268 part buffers in 568 ms each night. It replaced an Excel workbook that covered only the top 150 parts.',
        'Indexed an 80,000-document, 38 GB proof-of-delivery archive with PyMuPDF and Tesseract OCR, cutting full indexing from ~8 hours to 1.5 while keeping scanner-misread invoice numbers searchable.',
        'Built a margin dashboard that normalizes part cost into each product\'s unit of measure, cutting false below-cost pricing alerts by 98% (786 → 16).',
        'Shipped English/Spanish localization across web and mobile, with a missing translation failing the build.',
      ],
    },
    {
      role: 'Data Engineering Intern',
      org: 'Miami Waterkeeper',
      date: 'Sep – Dec 2024',
      highlights: [
        'Built ETL pipelines migrating organizational data from Excel into Azure and Looker.',
        'Built data visualizations in Looker and Python, using SQL for filtering and data prep.',
        'Managed sprint tasks using Scrum.',
      ],
    },
    {
      role: 'Volunteer',
      org: 'AmeriCorps',
      date: 'Aug 2021 – Aug 2022',
      highlights: ['Mentored 20+ students, tracking academic progress and reporting areas for improvement to parents.'],
    },
  ],
  skills: {
    languages: ['Python', 'C/C++', 'SQL', 'JavaScript'],
    frameworks: [
      'Docker',
      'FastAPI',
      'NiceGUI',
      'Streamlit',
      'ESP-IDF/FreeRTOS',
      'Tesseract OCR',
      'Fishbowl ERP',
    ],
    systems: [
      'RHEL 9 administration',
      'Embedded/firmware development',
      'Logic-analyzer debugging',
      'SQL Server',
    ],
  },
};
