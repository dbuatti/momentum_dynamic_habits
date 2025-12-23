// ... inside NextBadgeCard component
// ... inside render logic
if (!badge) {
  return (
    <Card className="bg-green-50 border border-green-200 rounded-2xl shadow-sm border-0">
      <CardContent className="p-5">
        <div className="flex items-center space-x-4">
          <div className="bg-green-100 rounded-full p-3">
            <Trophy className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-grow">
            <p className="font-semibold">All badges unlocked!</p>
            <p className="text-sm text-muted-foreground">You are a true champion.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
// ... rest of file