// ... existing imports
// ... inside Index component
// Find the "Create New Habit" button and update its link
<Link to="/create-habit">
  <Button className="w-full h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90">
    <PlusCircle className="w-6 h-6 mr-2" />
    Create New Habit
  </Button>
</Link>
// ... rest of file