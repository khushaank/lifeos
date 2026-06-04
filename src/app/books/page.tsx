"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { PageShell } from "@/components/page-shell";
import { useLifeStore, type Book } from "@/store/useLifeStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Plus, Search, Trash2, Edit2, CheckCircle2, X, BookMarked, Trophy, ArrowRight, ImagePlus, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image";

const emptyBook = (): Book => ({
  id: "",
  title: "",
  author: "",
  total_pages: 100,
  current_page: 0,
  completed: false,
  notes: "",
  cover_url: undefined,
});

export default function BooksPage() {
  const books = useLifeStore((s) => s.books);
  const saveBook = useLifeStore((s) => s.saveBook);
  const deleteBook = useLifeStore((s) => s.deleteBook);
  const syncAll = useLifeStore((s) => s.syncAll);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "reading" | "completed">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyBook());
  const [saving, setSaving] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Quick progress update state
  const [quickUpdateId, setQuickUpdateId] = useState<string | null>(null);
  const [quickPages, setQuickPages] = useState<string>("");

  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    syncAll({ force: true });
  }, [syncAll]);

  // Derived stats
  const stats = useMemo(() => {
    const total = books.length;
    const reading = books.filter((b) => !b.completed && b.current_page > 0).length;
    const completed = books.filter((b) => b.completed).length;
    const toRead = books.filter((b) => !b.completed && b.current_page === 0).length;
    
    // Count total pages read across all books
    const totalPagesRead = books.reduce((acc, b) => acc + (b.completed ? b.total_pages : b.current_page), 0);

    return { total, reading, completed, toRead, totalPagesRead };
  }, [books]);

  // Filtered books list
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "reading" && !book.completed) ||
        (activeTab === "completed" && book.completed);

      return matchesSearch && matchesTab;
    });
  }, [books, searchQuery, activeTab]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 350, 0.75);
      setCoverPreview(dataUrl);
      setForm({ ...form, cover_url: dataUrl });
    } catch (err) {
      console.error("Cover compression failed:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.total_pages) return;

    setSaving(true);
    const total = Number(form.total_pages);
    const current = Number(form.current_page);
    const completed = form.completed || current >= total;

    const ok = await saveBook({
      ...form,
      id: editingId || "",
      title: form.title.trim(),
      author: form.author.trim(),
      total_pages: total,
      current_page: Math.min(total, current),
      completed,
    });
    
    setSaving(false);
    if (ok) {
      setFormOpen(false);
      setForm(emptyBook());
      setEditingId(null);
      setCoverPreview(null);
    }
  };

  const handleQuickUpdate = async (book: Book) => {
    const pages = Number(quickPages);
    if (isNaN(pages) || pages <= 0) return;

    const newCurrentPage = Math.min(book.total_pages, book.current_page + pages);
    const isCompleted = newCurrentPage >= book.total_pages;

    await saveBook({
      ...book,
      current_page: newCurrentPage,
      completed: isCompleted,
    });

    setQuickUpdateId(null);
    setQuickPages("");
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    await deleteBook(id);
  };

  const openEditForm = (book: Book) => {
    setEditingId(book.id);
    setForm({ ...book });
    setCoverPreview(book.cover_url || null);
    setFormOpen(true);
  };

  /* ---- Placeholder cover (stylized gradient card) ---- */
  const CoverPlaceholder = ({ title }: { title: string }) => (
    <div className="w-full h-full bg-gradient-to-br from-sky-100 via-teal-50 to-slate-100 dark:from-sky-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
      <span className="text-3xl font-black text-sky-300/60 dark:text-sky-700/60 select-none">
        {title.charAt(0).toUpperCase()}
      </span>
    </div>
  );

  return (
    <PageShell maxWidth="5xl" mainClassName="space-y-6" className="pb-16">
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-sky-500/10 via-teal-500/5 to-transparent px-6 py-6 sm:py-8 shadow-sm dark:border-slate-800">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Books Library</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Wikipedia of what you read. Search your library, log progress, and hit reading milestones.
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setForm(emptyBook());
              setCoverPreview(null);
              setFormOpen(true);
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold h-11 px-5 rounded-xl cursor-pointer shadow-md shadow-sky-500/15 shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add new book
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-6">
          <div className="p-3 bg-white/40 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-900">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Books</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.total}</p>
          </div>
          <div className="p-3 bg-white/40 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-900">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reading Now</p>
            <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{stats.reading}</p>
          </div>
          <div className="p-3 bg-white/40 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-900">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
              {stats.completed} <Trophy className="h-4 w-4 text-amber-500 fill-current shrink-0" />
            </p>
          </div>
          <div className="p-3 bg-white/40 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-900">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pages Read</p>
            <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{stats.totalPagesRead.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Add / Edit Book Form */}
      {formOpen && (
        <Card className="border-slate-200 shadow-lg rounded-3xl overflow-hidden bg-card/95 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <CardTitle className="text-lg font-black">{editingId ? "Edit Book" : "Add Book to Library"}</CardTitle>
              <CardDescription className="text-xs">Provide details about the book and your reading progress</CardDescription>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-4">
              {/* Cover Image Upload */}
              <div className="flex items-start gap-5">
                <div className="shrink-0">
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="w-24 h-36 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-600 cursor-pointer transition-colors relative group"
                  >
                    {coverPreview ? (
                      <>
                        <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="h-5 w-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400">
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Cover</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                  {coverPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPreview(null);
                        setForm({ ...form, cover_url: undefined });
                      }}
                      className="mt-1 text-[10px] font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      Remove cover
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">Book Title</Label>
                      <Input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                        placeholder="e.g. Atomic Habits"
                        className="bg-slate-50 border-slate-200 h-10 text-sm focus:border-sky-500 focus:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">Author</Label>
                      <Input
                        value={form.author}
                        onChange={(e) => setForm({ ...form, author: e.target.value })}
                        placeholder="e.g. James Clear"
                        className="bg-slate-50 border-slate-200 h-10 text-sm focus:border-sky-500 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Pages</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.total_pages}
                        onChange={(e) => setForm({ ...form, total_pages: parseInt(e.target.value) || 1 })}
                        required
                        className="bg-slate-50 border-slate-200 h-10 text-sm focus:border-sky-500 focus:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">Current Page</Label>
                      <Input
                        type="number"
                        min={0}
                        max={form.total_pages}
                        value={form.current_page}
                        onChange={(e) => setForm({ ...form, current_page: parseInt(e.target.value) || 0 })}
                        className="bg-slate-50 border-slate-200 h-10 text-sm focus:border-sky-500 focus:ring-sky-500"
                      />
                    </div>
                    <div className="flex items-center justify-between sm:justify-center gap-3 sm:pt-6">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Completed?</span>
                      <Switch
                        checked={form.completed || form.current_page >= form.total_pages}
                        onCheckedChange={(val) => setForm({ ...form, completed: val, current_page: val ? form.total_pages : form.current_page })}
                        className="data-[state=checked]:bg-sky-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">Key Lessons or Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Summarize key takeaways, favorite quotes, or thoughts..."
                  className="bg-slate-50 border-slate-200 resize-none h-24 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500 text-sm"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button type="submit" disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-white font-bold h-11 px-6 rounded-xl cursor-pointer">
                  {saving ? "Saving..." : "Save Book"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  className="border-slate-200 hover:bg-slate-50 cursor-pointer h-11 rounded-xl px-5 text-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-800 self-start">
          {(["all", "reading", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                activeTab === tab
                  ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {tab === "all" ? "All" : tab === "reading" ? "Reading" : "Finished"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/80 h-10 text-sm focus:border-sky-500 focus:ring-sky-500 rounded-xl"
          />
        </div>
      </div>

      {/* Books List Grid */}
      {filteredBooks.length === 0 ? (
        <Card className="border-slate-200/80 dark:border-slate-800/80 rounded-2xl bg-slate-50/40 dark:bg-slate-900/10">
          <CardContent className="py-14 text-center flex flex-col items-center justify-center">
            <BookMarked className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No books found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {searchQuery ? "No matches for your search. Try another query." : "Start populating your personal reading wikipedia now."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredBooks.map((book) => {
            const progressPct = book.total_pages > 0 ? Math.round((book.current_page / book.total_pages) * 100) : 0;
            const isCompleted = book.completed;

            return (
              <Card
                key={book.id}
                className={cn(
                  "border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between group",
                  isCompleted
                    ? "bg-gradient-to-br from-emerald-500/5 via-card to-card dark:from-emerald-950/15"
                    : book.current_page > 0
                      ? "bg-gradient-to-br from-sky-500/5 via-card to-card dark:from-sky-950/15"
                      : "bg-card"
                )}
              >
                <div>
                  <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                    {/* Cover thumbnail + Book info */}
                    <div className="flex gap-4 min-w-0 flex-1">
                      {/* Cover image thumbnail */}
                      <div className="w-14 h-20 rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-800 shrink-0 shadow-sm">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={`${book.title} cover`} className="w-full h-full object-cover" />
                        ) : (
                          <CoverPlaceholder title={book.title} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </span>
                          ) : book.current_page > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                              Reading
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              To Read
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-base text-slate-800 dark:text-white leading-tight truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            by {book.author}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions dropdown/buttons */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Edit book details"
                        onClick={() => openEditForm(book)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Remove book"
                        onClick={() => handleDelete(book.id, book.title)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3 space-y-4">
                    {/* Goodreads progress tracking */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Goodreads progress</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {book.current_page} / {book.total_pages} pages ({progressPct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isCompleted ? "bg-emerald-500" : "bg-sky-500"
                          )}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    {book.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic bg-slate-50/50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                        &ldquo;{book.notes}&rdquo;
                      </p>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100/50 dark:border-slate-800/40 mt-2 flex items-center justify-between min-h-[52px]">
                  {/* Last updated */}
                  <span className="text-[10px] text-slate-400">
                    Updated: {book.updated_at ? new Date(book.updated_at).toLocaleDateString() : "Just now"}
                  </span>

                  {/* Inline quick progress update */}
                  {!isCompleted && (
                    <div className="flex items-center gap-1.5">
                      {quickUpdateId === book.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            placeholder="+ Pages"
                            min={1}
                            max={book.total_pages - book.current_page}
                            value={quickPages}
                            onChange={(e) => setQuickPages(e.target.value)}
                            className="w-16 h-8 text-xs border-slate-200 bg-slate-50 p-1"
                          />
                          <button
                            onClick={() => handleQuickUpdate(book)}
                            className="bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-2.5 h-8 text-xs font-bold cursor-pointer transition-colors"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setQuickUpdateId(null);
                              setQuickPages("");
                            }}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5 text-slate-500" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setQuickUpdateId(book.id);
                            setQuickPages("");
                          }}
                          className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 cursor-pointer"
                        >
                          Log pages <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
