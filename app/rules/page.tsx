import NavBar from '@/components/NavBar'
import fs from 'fs'
import path from 'path'
import { remark } from 'remark'
import html from 'remark-html'

async function getRulebookHtml(): Promise<string> {
  const filePath = path.join(process.cwd(), 'docs', 'rulebook.md')
  const content = fs.readFileSync(filePath, 'utf-8')
  const result = await remark().use(html).process(content)
  return result.toString()
}

export default async function RulesPage() {
  const rulebookHtml = await getRulebookHtml()

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-navy text-foam p-4 mb-6">
          <h1 className="font-headline text-4xl text-beer-gold tracking-wider">
            THE RULEBOOK
          </h1>
          <p className="font-body text-sm text-foam/70 mt-1">
            Official Brewmier League regulations. No moaning.
          </p>
        </div>
        <div
          className="rulebook-content font-body bg-foam border-2 border-navy p-6"
          dangerouslySetInnerHTML={{ __html: rulebookHtml }}
        />
      </main>
    </>
  )
}
